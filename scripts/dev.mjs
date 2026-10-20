#!/usr/bin/env node
// Local development launcher for Parsons Puzzles.
//
//   npm start             start everything that is set up (the frontend always; the
//                         API and the Lean worker when their requirements are met)
//   npm run doctor        check the setup and explain how to fix gaps, without
//                         starting or changing anything
//
// Options for npm start (after `--`, e.g. `npm start -- --web-only`):
//   --web-only   start only the frontend
//   --no-lean    don't start the Lean worker
//   --yes        install missing dependencies without asking
//
// What this script will and won't do:
//   - It only uses Node's built-in modules, so it runs before anything is installed.
//   - It never downloads tools, edits your files or PATH, or needs admin rights.
//   - The only thing it installs is npm packages from the committed lockfiles
//     (`npm ci`), and only after you agree (or pass --yes).
//   - Ports and service URLs are passed to the child processes as environment
//     variables; your .env files are read but never written.

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WINDOWS = process.platform === 'win32';
const MIN_NODE = [22, 12];
const DEFAULT_PORTS = { web: 5173, api: 5001, lean: 3001 };

// ------------------------------------------------------------------ output

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : String(text));
const green = paint(32);
const yellow = paint(33);
const red = paint(31);
const dim = paint(2);
const bold = paint(1);
const LABEL_COLORS = { web: paint(36), api: paint(35), lean: paint(34) };

const line = (status, text, hint) => {
  const tag = { ok: green('[ok]'), warn: yellow('[!!]'), off: dim('[--]'), fail: red('[xx]') }[status];
  console.log(`  ${tag} ${text}`);
  if (hint) console.log(`       ${dim(hint)}`);
};

// ------------------------------------------------------------------ helpers (exported for tests)

export function parseEnvFile(text) {
  const env = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const match = raw.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '');
    env[match[1]] = value;
  }
  return env;
}

// Values copied unchanged from an .env.example template
export const isPlaceholder = (value) => !value || /your-|replace-with|<[^>]+>/i.test(value);

export function nodeVersionOk(version = process.versions.node) {
  const [major, minor] = version.split('.').map(Number);
  return major > MIN_NODE[0] || (major === MIN_NODE[0] && minor >= MIN_NODE[1]);
}

// Host and port of a plain mongodb:// URI with a single host; null for SRV or multi-host URIs.
export function mongoTarget(uri) {
  const match = /^mongodb:\/\/(?:[^@/]*@)?([^/,?]+)(?:[/?]|$)/.exec(uri || '');
  if (!match) return null;
  const [host, port] = match[1].replace(/^\[(.*)\]$/, '$1').split(/:(?=\d+$)/);
  return { host, port: Number(port) || 27017 };
}

export function canConnect(port, host = '127.0.0.1', timeoutMs = 400) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (result) => { socket.destroy(); resolve(result); };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

const portInUse = async (port) => (await canConnect(port, '127.0.0.1')) || (await canConnect(port, '::1'));

export async function findFreePort(preferred, taken = new Set(), isInUse = portInUse) {
  for (let port = preferred; port < preferred + 50; port += 1) {
    if (!taken.has(port) && !(await isInUse(port))) return port;
  }
  throw new Error(`No free port found near ${preferred}`);
}

/**
 * Decides which services to start. `state` is the result of inspect(); returns
 * { web, api, lean }, each { run: boolean, reason?: string }.
 */
export function planServices(state, options = {}) {
  const web = state.deps.frontend
    ? { run: true }
    : { run: false, reason: 'frontend dependencies are not installed' };

  let api;
  if (options.webOnly) api = { run: false, reason: '--web-only' };
  else if (!state.deps.backend) api = { run: false, reason: 'backend dependencies are not installed' };
  else if (!state.mongoUri) api = { run: false, reason: 'MONGODB_URI is not set (backend/.env)' };
  else api = { run: true };

  let lean;
  if (options.webOnly || options.noLean) lean = { run: false, reason: options.webOnly ? '--web-only' : '--no-lean' };
  else if (!state.lake) lean = { run: false, reason: 'Lean (elan/lake) is not installed' };
  else if (!state.mathlib) lean = { run: false, reason: 'the Mathlib cache is not downloaded' };
  else lean = { run: true };

  return { web, api, lean };
}

// ------------------------------------------------------------------ inspection

const exe = (name) => (IS_WINDOWS ? `${name}.exe` : name);
const pick = (source, keys) => Object.fromEntries(keys.filter((key) => source[key]).map((key) => [key, source[key]]));

function findLakeDir() {
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  dirs.push(path.join(os.homedir(), '.elan', 'bin'));
  return dirs.find((dir) => existsSync(path.join(dir, exe('lake')))) || null;
}

// true when installed, 'stale' when the lockfile asks for packages or versions that
// aren't installed (e.g. after a pull), false when nothing is installed.
function depsState(dir) {
  const installedFile = path.join(ROOT, dir, 'node_modules', '.package-lock.json');
  if (!existsSync(installedFile)) return false;
  try {
    const wanted = JSON.parse(readFileSync(path.join(ROOT, dir, 'package-lock.json'), 'utf8')).packages || {};
    const installed = JSON.parse(readFileSync(installedFile, 'utf8')).packages || {};
    return lockfileSatisfied(wanted, installed) ? true : 'stale';
  } catch {
    return true;
  }
}

// npm records what it installed in node_modules/.package-lock.json. Optional
// packages (e.g. other platforms' binaries) may legitimately be missing.
export function lockfileSatisfied(wanted, installed) {
  return Object.entries(wanted).every(([key, entry]) => (
    !key || entry.optional || entry.link || installed[key]?.version === entry.version
  ));
}

function readEnv(file) {
  const full = path.join(ROOT, file);
  return existsSync(full) ? parseEnvFile(readFileSync(full, 'utf8')) : null;
}

async function inspect() {
  const backendEnvFile = readEnv('backend/.env');
  // Variables already in the environment win, as they do for the backend itself (dotenv).
  const backendEnv = { ...backendEnvFile, ...pick(process.env, ['MONGODB_URI', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'EDUCATOR_KEY']) };
  const mongoUri = isPlaceholder(backendEnv.MONGODB_URI) ? null : backendEnv.MONGODB_URI;
  const target = mongoTarget(mongoUri);

  return {
    node: process.versions.node,
    deps: {
      root: depsState('.'),
      frontend: depsState('frontend'),
      backend: depsState('backend'),
    },
    backendEnvFile: Boolean(backendEnvFile),
    backendPort: Number(backendEnvFile?.PORT) || DEFAULT_PORTS.api,
    mongoUri,
    mongo: target ? { ...target, reachable: await canConnect(target.port, target.host, 1500) } : null,
    educatorKey: Boolean(backendEnv.EDUCATOR_KEY),
    openai: !isPlaceholder(backendEnv.OPENAI_API_KEY),
    openaiModel: isPlaceholder(backendEnv.OPENAI_MODEL) ? null : backendEnv.OPENAI_MODEL,
    lake: findLakeDir(),
    mathlib: existsSync(path.join(ROOT, 'lean-worker', '.lake', 'packages', 'mathlib', '.lake', 'build', 'lib', 'lean', 'Mathlib.olean')),
  };
}

// ------------------------------------------------------------------ doctor

function report(state, plan) {
  console.log(bold('\nParsons Puzzles setup check\n'));

  console.log(bold('Tools'));
  line(nodeVersionOk(state.node) ? 'ok' : 'fail', `Node.js ${state.node}`,
    nodeVersionOk(state.node) ? null : `Install Node.js ${MIN_NODE.join('.')} or newer (see .nvmrc).`);
  line(state.lake ? 'ok' : 'off', state.lake ? `Lean toolchain (elan) in ${state.lake}` : 'Lean toolchain: not installed (optional, for AI generation)',
    state.lake ? null : 'Install elan from https://lean-lang.org/install/manual/, then see lean-worker/README.md');

  console.log(bold('\nDependencies'));
  for (const [name, key, command] of [['frontend', 'frontend', 'npm ci --prefix frontend'], ['backend', 'backend', 'npm ci --prefix backend'], ['repo tools (lint, dev:fullstack)', 'root', 'npm ci']]) {
    const value = state.deps[key];
    if (value === true) line('ok', name);
    else if (value === 'stale') line('warn', `${name}: older than package-lock.json`, `Run: ${command}`);
    else line(key === 'frontend' ? 'fail' : 'off', `${name}: not installed`, `Run: ${command}   (or "npm run setup" for everything)`);
  }

  console.log(bold('\nBackend'));
  line(state.backendEnvFile ? 'ok' : 'off', state.backendEnvFile ? 'backend/.env found' : 'backend/.env not found',
    state.backendEnvFile ? null : 'Copy backend/.env.example to backend/.env and fill it in.');
  if (!state.mongoUri) line('off', 'MONGODB_URI not set', 'Set it in backend/.env (local MongoDB or Atlas).');
  else if (!state.mongo) line('ok', 'MONGODB_URI set (Atlas/SRV address, not checked)');
  else if (state.mongo.reachable) line('ok', `MongoDB reachable at ${state.mongo.host}:${state.mongo.port}`);
  else line('warn', `MongoDB not reachable at ${state.mongo.host}:${state.mongo.port}`, 'Start MongoDB; the API keeps retrying until it can connect.');
  line(state.educatorKey ? 'ok' : 'off', state.educatorKey ? 'Educator key set' : 'EDUCATOR_KEY not set (needed to publish and review puzzles)',
    state.educatorKey || !state.backendEnvFile ? null : 'Add EDUCATOR_KEY=educator to backend/.env for local development.');
  line(state.openai ? 'ok' : 'off', state.openai ? `OpenAI key set${state.openaiModel ? ` (model ${state.openaiModel})` : ''}` : 'OpenAI key not set (only needed for AI-generated puzzles)');

  console.log(bold('\nLean worker'));
  line(state.mathlib ? 'ok' : 'off', state.mathlib ? 'Mathlib cache downloaded' : 'Mathlib cache not downloaded',
    state.mathlib || !state.lake ? null : 'Run in lean-worker/: lake exe cache get');

  console.log(bold('\nnpm start will run'));
  for (const [key, label] of [['web', 'Frontend'], ['api', 'API'], ['lean', 'Lean worker']]) {
    const service = plan[key];
    line(service.run ? 'ok' : 'off', service.run ? label : `${label}: skipped (${service.reason})`);
  }
  if (!plan.api.run) console.log(dim('\n  Without the API the app uses its bundled puzzles, which is enough to try the student page.'));
  console.log('');
}

// ------------------------------------------------------------------ install (asks first)

async function confirm(question, assumeYes) {
  if (assumeYes) return true;
  if (!process.stdin.isTTY) return false;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

// On Windows npm is npm.cmd, which only runs through a shell. The command line is
// built from fixed strings in this file (never user input), so nothing needs escaping.
function spawnNpm(args, options) {
  return IS_WINDOWS
    ? spawn(['npm', ...args].join(' '), { ...options, shell: true })
    : spawn('npm', args, options);
}

function run(args) {
  return new Promise((resolve) => {
    const child = spawnNpm(args, { cwd: ROOT, stdio: 'inherit' });
    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

async function ensureDeps(state, options) {
  const wanted = ['frontend'];
  if (!options.webOnly && state.mongoUri) wanted.push('backend');
  for (const dir of wanted) {
    const current = state.deps[dir];
    if (current === true) continue;
    const verb = current === 'stale' ? 'Update' : 'Install';
    const ok = await confirm(`${verb} ${dir} dependencies with "npm ci --prefix ${dir}" (from the committed lockfile)?`, options.yes);
    if (!ok) {
      if (current !== 'stale') console.log(dim(`  Skipped. Run "npm ci --prefix ${dir}" yourself, or "npm start -- --yes".`));
      continue;
    }
    if (await run(['ci', '--prefix', dir])) state.deps[dir] = true;
    else console.log(red(`  npm ci --prefix ${dir} failed.`));
  }
}

// ------------------------------------------------------------------ start

const children = new Map();
let stopping = false;

function startService(name, args, env) {
  const prefix = LABEL_COLORS[name](`[${name}]`.padEnd(7));
  const child = spawnNpm(args, {
    cwd: ROOT,
    env: { ...process.env, ...env, FORCE_COLOR: useColor ? '1' : '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const forward = (stream, target) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const text of lines) target.write(`${prefix} ${text}\n`);
    });
  };
  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);
  child.on('exit', (code) => {
    children.delete(name);
    if (stopping) return;
    console.log(`${prefix} ${red(`stopped (exit code ${code})`)}`);
    stopAll(code === 0 ? 0 : 1);
  });
  children.set(name, child);
}

function stopAll(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  // Node may exit on its own once the children are gone; keep the failure code.
  process.exitCode = exitCode;
  console.log(dim('\nStopping all services...'));
  for (const child of children.values()) {
    // npm runs each service in a child process tree; stop the whole tree.
    if (IS_WINDOWS) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(exitCode), 1500).unref();
}

async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && !stopping) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.status < 500) return true;
    } catch { /* not up yet */ }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function start(options) {
  if (!nodeVersionOk()) {
    console.error(red(`Node.js ${MIN_NODE.join('.')} or newer is required (you have ${process.versions.node}).`));
    process.exit(1);
  }

  const state = await inspect();
  await ensureDeps(state, options);
  const plan = planServices(state, options);
  if (!plan.web.run) {
    console.error(red('The frontend dependencies are not installed, so there is nothing to start. Run: npm run setup'));
    process.exit(1);
  }

  const taken = new Set();
  const ports = {};
  for (const key of ['lean', 'api', 'web']) {
    if (!plan[key].run) continue;
    ports[key] = await findFreePort(key === 'api' ? state.backendPort : DEFAULT_PORTS[key], taken);
    taken.add(ports[key]);
  }
  const inContainer = Boolean(process.env.REMOTE_CONTAINERS || process.env.CODESPACES);

  if (plan.lean.run) {
    startService('lean', ['--prefix', 'lean-worker', 'start'], {
      PORT: String(ports.lean),
      PATH: `${state.lake}${path.delimiter}${process.env.PATH}`,
    });
  }
  if (plan.api.run) {
    startService('api', ['--prefix', 'backend', 'run', 'dev'], {
      PORT: String(ports.api),
      NODE_ENV: process.env.NODE_ENV || 'development',
      MONGODB_URI: state.mongoUri,
      ...(plan.lean.run ? { LEAN_VERIFY_URL: `http://127.0.0.1:${ports.lean}/verify` } : {}),
    });
  }
  // With the API running, the browser calls /api on the frontend's own origin and
  // Vite forwards it, so changed ports and Codespaces URLs need no extra setup.
  startService('web', ['--prefix', 'frontend', 'run', 'dev', '--', '--port', String(ports.web), '--strictPort', ...(inContainer ? ['--host', '0.0.0.0'] : [])], {
    ...(plan.api.run ? { API_PROXY_TARGET: `http://127.0.0.1:${ports.api}`, VITE_API_BASE_URL: '/api' } : {}),
  });

  process.on('SIGINT', () => stopAll(0));
  process.on('SIGTERM', () => stopAll(0));

  const ready = await waitFor(`http://localhost:${ports.web}/`, 60_000);
  if (stopping) return;
  console.log(bold(`\n${ready ? green('Ready') : yellow('Still starting')}: open http://localhost:${ports.web}`));
  line(plan.api.run ? 'ok' : 'off', plan.api.run ? `API on http://localhost:${ports.api}/api (the frontend proxies /api to it)` : `API not started: ${plan.api.reason}`);
  line(plan.lean.run ? 'ok' : 'off', plan.lean.run ? `Lean worker on http://127.0.0.1:${ports.lean}` : `Lean worker not started: ${plan.lean.reason}`);
  if (!plan.api.run) console.log(dim('  The app uses its bundled puzzles. Run "npm run doctor" to see how to enable the rest.'));
  console.log(dim('  Press Ctrl+C to stop everything.\n'));
}

// ------------------------------------------------------------------ main

const OPTIONS = ['--doctor', '--web-only', '--no-lean', '--yes', '-y'];

async function main(argv) {
  const unknown = argv.filter((arg) => !OPTIONS.includes(arg));
  if (unknown.length) {
    console.error(`Unknown option(s): ${unknown.join(' ')}. Use --web-only, --no-lean or --yes.`);
    process.exit(2);
  }
  const options = {
    webOnly: argv.includes('--web-only'),
    noLean: argv.includes('--no-lean'),
    yes: argv.includes('--yes') || argv.includes('-y'),
  };
  if (argv.includes('--doctor')) {
    const state = await inspect();
    report(state, planServices(state, options));
    process.exit(state.deps.frontend === false || !nodeVersionOk(state.node) ? 1 : 0);
  }
  await start(options);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(red(error.stack || error.message));
    process.exit(1);
  });
}
