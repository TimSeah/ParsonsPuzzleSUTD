// Pure verification policy for the Lean worker, kept separate from the HTTP
// server and process handling so it can be unit tested without Lean installed.

export const ALLOWED_AXIOMS = new Set(['propext', 'Classical.choice', 'Quot.sound']);
export const POLICY_VERSION = 2;

const THEOREM_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;
const NOT_IDENT_BEFORE = "(?<![\\w.'])";
const NOT_IDENT_AFTER = "(?![\\w'])";

const word = (...names) => new RegExp(`${NOT_IDENT_BEFORE}(?:${names.join('|')})${NOT_IDENT_AFTER}`);

// Attributes a generated proof may use. Anything else is rejected, because
// attributes such as @[command_elab], @[tactic] or @[init] can register code
// that runs during elaboration (e.g. replacing the #print axioms command).
const ALLOWED_ATTRIBUTES = new Set([
  'simp', 'ext', 'reducible', 'irreducible', 'norm_cast', 'push_cast', 'symm', 'refl', 'trans', 'gcongr', 'mono',
]);

// Checked against the source with comments removed.
const FORBIDDEN = [
  [word('sorry', 'admit'), 'sorry/admit placeholders are not allowed'],
  [word('axiom', 'unsafe', 'implemented_by', 'extern', 'native_decide'), 'Custom axioms, unsafe code and native evaluation are not allowed'],
  [
    word('run_cmd', 'run_elab', 'run_meta', 'run_tac', 'elab', 'elab_rules', 'macro', 'macro_rules', 'syntax',
      'declare_syntax_cat', 'initialize', 'builtin_initialize'),
    'Metaprogramming commands are not allowed',
  ],
  [word('notation', 'notation3', 'infix', 'infixl', 'infixr', 'prefix', 'postfix'), 'Custom notation is not allowed'],
  [
    word('Lean', 'Elab', 'Meta', 'MetaM', 'TermElabM', 'CommandElabM', 'TacticM', 'CoreM', 'addDecl', 'addAndCompile',
      'logInfo', 'evalExpr', 'Syntax', 'TSyntax'),
    'Lean metaprogramming APIs are not allowed',
  ],
  [/`\(/, 'Syntax quotations are not allowed'],
  [
    /#(?:eval|exit|print|check|check_failure|reduce|synth|guard|guard_msgs|guard_expr|lint|help|find|where|time|norm_num|simp|conv|explode|html|widget)(?![\w'])/,
    'Commands starting with # (such as #eval, #print or #exit) are not allowed',
  ],
  [word('IO', 'BaseIO', 'EIO', 'System', 'ofReduceBool', 'trustCompiler'), 'IO and compiler-trusting code is not allowed'],
  [/set_option\s+debug\./, 'debug options are not allowed'],
];

// Lexes just enough Lean to drop comments (nested /- -/ and --) while
// recognising string literals and «» names, which could otherwise smuggle a
// comment opener ("--") past the policy checks.
export function scanSource(source) {
  let code = '';
  let depth = 0;
  let hasStringLiteral = false;
  let hasGuillemets = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const two = source.slice(i, i + 2);
    if (depth > 0) {
      if (two === '/-') { depth += 1; i += 1; }
      else if (two === '-/') { depth -= 1; i += 1; }
      else if (ch === '\n') code += '\n';
      continue;
    }
    if (two === '/-') { depth = 1; i += 1; continue; }
    if (two === '--') {
      while (i < source.length && source[i] !== '\n') i += 1;
      if (source[i] === '\n') code += '\n';
      continue;
    }
    if (ch === '"') {
      hasStringLiteral = true;
      for (i += 1; i < source.length && source[i] !== '"'; i++) if (source[i] === '\\') i += 1;
      code += ' ';
      continue;
    }
    if (ch === '«') {
      hasGuillemets = true;
      while (i < source.length && source[i] !== '»') i += 1;
      code += ' ';
      continue;
    }
    code += ch;
  }
  return { code, hasStringLiteral, hasGuillemets };
}

export function stripComments(source) {
  return scanSource(source).code;
}

export function disallowedAttributes(code) {
  const lists = [...code.matchAll(/@\[([^\]]*)\]/g), ...code.matchAll(/(?<![\w.'])attribute\s*\[([^\]]*)\]/g)];
  const bad = [];
  for (const [, list] of lists) {
    for (const entry of list.split(',')) {
      const name = entry.trim().replace(/^(?:local|scoped)\s+/, '').split(/\s+/)[0];
      if (!ALLOWED_ATTRIBUTES.has(name)) bad.push(name || '(empty)');
    }
  }
  return bad;
}

export function importedModules(source) {
  const modules = [];
  for (const match of stripComments(source).matchAll(/^\s*import\s+([^\n]+)$/gm)) {
    modules.push(...match[1].trim().split(/\s+/));
  }
  return modules;
}

export function declaresTheorem(source, theoremName) {
  const pattern = new RegExp(
    `^\\s*(?:@\\[[^\\]\\n]*\\]\\s*)*(?:(?:private|protected|noncomputable)\\s+)*(?:theorem|lemma)\\s+${theoremName}(?![\\w.'!?])`,
    'm',
  );
  return pattern.test(stripComments(source));
}

export function validateSource(source, theoremName, { maxBytes = 20000 } = {}) {
  if (typeof source !== 'string' || !source.trim()) return 'Lean source is required';
  if (Buffer.byteLength(source) > maxBytes) return 'Lean source exceeds the size limit';
  if (typeof theoremName !== 'string' || !THEOREM_NAME.test(theoremName)) return 'A valid theoremName is required';
  const { code, hasStringLiteral, hasGuillemets } = scanSource(source);
  if (hasStringLiteral) return 'String literals are not allowed in proof sources';
  if (hasGuillemets) return '«»-quoted names are not allowed in proof sources';
  for (const [pattern, message] of FORBIDDEN) if (pattern.test(code)) return message;
  const badAttributes = disallowedAttributes(code);
  if (badAttributes.length) return `Attributes are not allowed: ${badAttributes.join(', ')}`;
  for (const module of importedModules(source)) {
    if (module !== 'Mathlib' && !module.startsWith('Mathlib.')) return `Import is not allowed: ${module}`;
  }
  if (!declaresTheorem(source, theoremName)) return `Theorem ${theoremName} is not declared at the top level of the Lean source`;
  return null;
}

// Appends `#print axioms` so the compiler reports exactly which axioms the
// theorem relies on (sorry shows up as sorryAx, native_decide as ofReduceBool).
export function buildCheckedSource(source, theoremName) {
  const body = source.replace(/\s+$/, '');
  const axiomsLine = body.split('\n').length + 2;
  return { text: `${body}\n\n#print axioms ${theoremName}\n`, axiomsLine };
}

export function parseMessages(output) {
  const messages = [];
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const msg = JSON.parse(trimmed);
      if (msg && typeof msg === 'object' && typeof msg.severity === 'string') {
        messages.push({
          severity: msg.severity,
          line: msg.pos?.line,
          column: msg.pos?.column,
          kind: typeof msg.kind === 'string' ? msg.kind : '',
          message: String(msg.data ?? ''),
          structured: true,
        });
        continue;
      }
    } catch {
      // Not a JSON message (e.g. Lake output); kept as unstructured text.
    }
    messages.push({ severity: 'unknown', message: trimmed, structured: false });
  }
  return messages;
}

// Lint-style warnings (unused variables, deprecated names, ...) don't affect soundness.
const isLinterWarning = (msg) => /^(?:Lean\.)?[Ll]inter\./.test(msg.kind) || /set_option linter\./.test(msg.message);

export function parseAxioms(message, theoremName) {
  const prefix = `'${theoremName}' `;
  if (!message.startsWith(prefix)) return null;
  const rest = message.slice(prefix.length);
  if (rest.startsWith('does not depend on any axioms')) return [];
  const match = rest.match(/^depends on axioms: \[([^\]]*)\]/);
  if (!match) return null;
  return match[1].split(',').map((name) => name.trim()).filter(Boolean);
}

export function evaluate({ exitCode, output, theoremName, axiomsLine }) {
  const messages = parseMessages(output);
  const errors = messages.filter((m) => m.severity === 'error' || (!m.structured && exitCode !== 0));
  const warnings = messages.filter((m) => m.severity === 'warning');
  const fatalWarnings = warnings.filter((m) => !isLinterWarning(m));

  let axioms = null;
  for (const m of messages) {
    if (m.severity !== 'information' || !(m.line >= axiomsLine)) continue;
    axioms = parseAxioms(m.message, theoremName);
    if (axioms) break;
  }
  const disallowedAxioms = (axioms || []).filter((name) => !ALLOWED_AXIOMS.has(name));
  const usesSorry = (axioms || []).includes('sorryAx') || warnings.some((m) => /declaration uses 'sorry'/.test(m.message));

  const policyChecks = {
    noUnsolvedGoals: exitCode === 0 && errors.length === 0,
    noSorry: !usesSorry,
    noAdmit: !usesSorry,
    noWarnings: fatalWarnings.length === 0,
    theoremChecked: axioms !== null,
    allowedAxioms: axioms !== null && disallowedAxioms.length === 0,
    allowedImports: true,
  };
  const valid = Object.values(policyChecks).every(Boolean);

  const diagnostics = [...errors, ...fatalWarnings].map((m) => ({
    severity: m.severity === 'warning' ? 'warning' : 'error',
    line: m.line,
    column: m.column,
    message: m.message.slice(0, 1000),
  }));
  if (disallowedAxioms.length) {
    diagnostics.push({ severity: 'error', message: `Theorem ${theoremName} depends on disallowed axioms: ${disallowedAxioms.join(', ')}` });
  }
  if (axioms === null && policyChecks.noUnsolvedGoals) {
    diagnostics.push({ severity: 'error', message: `Could not confirm the axioms used by ${theoremName}` });
  }

  return {
    status: valid ? 'verified' : 'rejected',
    valid,
    diagnostics: diagnostics.slice(0, 30),
    axioms: axioms || [],
    policyChecks,
    policyVersion: POLICY_VERSION,
  };
}
