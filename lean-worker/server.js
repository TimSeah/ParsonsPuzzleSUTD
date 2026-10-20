import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { CANDIDATE_MODULE, evaluate, parseCheckerOutput, validateSource } from './verifier.js';
import { createLimiter } from './limiter.js';

const PORT = Number(process.env.PORT || 3001);
// Loopback only by default; the Docker image sets HOST=0.0.0.0 on a private network.
const HOST = process.env.HOST || '127.0.0.1';
const MAX_SOURCE_BYTES = Number(process.env.MAX_SOURCE_BYTES || 20000);
const DEFAULT_TIMEOUT_MS = Number(process.env.LEAN_TIMEOUT_MS || 30000);
// Each stage (compile, trusted check) gets at most this long.
const STAGE_CAP_MS = 30000;
const compileLimiter = createLimiter({
  maxConcurrent: Number(process.env.LEAN_MAX_CONCURRENT) || 1,
  maxQueue: Number(process.env.LEAN_MAX_QUEUE ?? 2),
});
const WORKER_DIR = fileURLToPath(new URL('.', import.meta.url));
const CHECKER = join(WORKER_DIR, 'Checker.lean');
const leanVersion = readFileSync(join(WORKER_DIR, 'lean-toolchain'), 'utf8').match(/v([0-9.]+)/)?.[1] || 'unknown';
const mathlibVersion = JSON.parse(readFileSync(join(WORKER_DIR, 'lake-manifest.json'), 'utf8'))
  .packages.find(pkg => pkg.name === 'mathlib')?.inputRev || 'unknown';
const LEAN_ENV = Object.fromEntries(
  ['PATH', 'HOME', 'USER', 'TMPDIR', 'ELAN_HOME', 'XDG_CACHE_HOME']
    .filter(name => process.env[name])
    .map(name => [name, process.env[name]])
);

function compilerStatus() {
  const result = spawnSync('lake', ['env', 'lean', '--version'], {
    cwd: WORKER_DIR,
    shell: false,
    env: LEAN_ENV,
    encoding: 'utf8',
    timeout: 30000,
  });
  return {
    ready: result.status === 0,
    error: result.status === 0 ? null : (result.error?.message || result.stderr || 'Lean compiler is unavailable').trim(),
  };
}

let compiler = compilerStatus();

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let text = '';
  for await (const chunk of req) {
    text += chunk;
    if (Buffer.byteLength(text) > MAX_SOURCE_BYTES * 2) throw new Error('REQUEST_TOO_LARGE');
  }
  return JSON.parse(text || '{}');
}

function runLake(args, timeoutMs) {
  return new Promise(resolve => {
    const child = spawn('lake', args, { cwd: WORKER_DIR, shell: false, env: LEAN_ENV });
    let stdout = '', stderr = '', timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    child.stdout.on('data', d => { stdout = (stdout + d).slice(-200000); });
    child.stderr.on('data', d => { stderr = (stderr + d).slice(-20000); });
    child.on('error', error => { clearTimeout(timer); resolve({ error }); });
    child.on('close', exitCode => { clearTimeout(timer); resolve({ exitCode, stdout, stderr, timedOut }); });
  });
}

// 1. Compile the untrusted source to <dir>/Candidate.olean.
// 2. Re-check that file in a separate trusted process (Checker.lean): kernel
//    replay of every declaration, then the theorem's axioms.
async function compile(source, theoremName, timeoutMs) {
  if (!compiler.ready) compiler = compilerStatus();
  if (!compiler.ready) {
    return {
      status: 'infrastructure_error',
      valid: false,
      diagnostics: [{ severity: 'error', message: compiler.error }],
      durationMs: 0,
    };
  }
  const dir = await mkdtemp(join(tmpdir(), 'parsons-lean-'));
  const file = join(dir, `${CANDIDATE_MODULE}.lean`);
  const olean = join(dir, `${CANDIDATE_MODULE}.olean`);
  await writeFile(file, `${source.replace(/\s+$/, '')}\n`, { mode: 0o600 });
  const started = Date.now();
  const finish = (result) => ({ ...result, durationMs: Date.now() - started, leanVersion, mathlibVersion });
  const failed = (run) => (run.error
    ? finish({ status: 'infrastructure_error', valid: false, diagnostics: [{ severity: 'error', message: run.error.message }] })
    : finish({ status: 'timeout', valid: false, diagnostics: [] }));
  try {
    const compileRun = await runLake(['env', 'lean', '--json', `--root=${dir}`, '-o', olean, file], Math.min(Math.max(timeoutMs, 1000), STAGE_CAP_MS));
    if (compileRun.error || compileRun.timedOut) return failed(compileRun);
    let checker = null;
    if (compileRun.exitCode === 0 && existsSync(olean)) {
      const checkRun = await runLake(['env', 'lean', '--run', CHECKER, dir, CANDIDATE_MODULE, theoremName], STAGE_CAP_MS);
      if (checkRun.error || checkRun.timedOut) return failed(checkRun);
      checker = parseCheckerOutput(checkRun);
    }
    return finish(evaluate({ exitCode: compileRun.exitCode, output: `${compileRun.stdout}\n${compileRun.stderr}`, theoremName, checker }));
  } finally { await rm(dir, { recursive: true, force: true }); }
}

http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, compiler.ready ? 200 : 503, {
      status: compiler.ready ? 'ok' : 'unavailable',
      leanVersion,
      mathlibVersion,
      error: compiler.error,
      compiles: compileLimiter.stats(),
    });
  }
  if (req.method !== 'POST' || req.url !== '/verify') return json(res, 404, { error: 'NOT_FOUND' });
  let clientGone = false;
  res.on('close', () => { if (!res.writableEnded) clientGone = true; });
  try {
    const body = await readJson(req);
    const error = validateSource(body.source, body.theoremName, { maxBytes: MAX_SOURCE_BYTES });
    if (error) return json(res, 422, { status: 'rejected', valid: false, diagnostics: [{ severity: 'error', message: error }] });
    let result;
    try {
      result = await compileLimiter.run(() => (clientGone
        ? { status: 'cancelled', valid: false, diagnostics: [] }
        : compile(body.source, body.theoremName, Number(body.timeoutMs || DEFAULT_TIMEOUT_MS))));
    } catch (limitError) {
      if (limitError.code !== 'BUSY') throw limitError;
      res.setHeader('Retry-After', '30');
      return json(res, 503, { status: 'infrastructure_error', valid: false, diagnostics: [{ severity: 'error', message: 'Lean worker is busy; please retry shortly' }] });
    }
    if (clientGone) return undefined;
    return json(res, result.status === 'infrastructure_error' ? 503 : 200, result);
  } catch (error) {
    return json(res, error.message === 'REQUEST_TOO_LARGE' ? 413 : 400, { status: 'rejected', valid: false, diagnostics: [{ severity: 'error', message: 'Invalid verification request' }] });
  }
}).listen(PORT, HOST, () => console.log(`Lean worker listening on http://${HOST}:${PORT}`));
