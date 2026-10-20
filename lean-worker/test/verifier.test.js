import test from 'node:test';
import assert from 'node:assert/strict';
import {
  declaresTheorem,
  evaluate,
  importedModules,
  parseCheckerOutput,
  scanSource,
  stripComments,
  validateSource,
} from '../verifier.js';

const SOURCE = `import Mathlib

theorem and_swap (p q : Prop) (h : p ∧ q) : q ∧ p := by
  obtain ⟨hp, hq⟩ := h
  exact ⟨hq, hp⟩
`;

// One `lean --json` message per line, as produced by Lean 4's SerialMessage.
function msg(severity, line, data, kind = '') {
  return JSON.stringify({
    fileName: '/tmp/Puzzle.lean', pos: { line, column: 0 }, endPos: null, keepFullRange: false,
    severity, caption: '', data, kind,
  });
}

const checked = (axioms, theorem = 'and_swap') => ({ ok: true, theorem, axioms, declarations: 1 });
const STANDARD = ['propext', 'Classical.choice', 'Quot.sound'];

function run({ exitCode = 0, messages = [], theoremName = 'and_swap', checker = checked(STANDARD) } = {}) {
  return evaluate({ exitCode, output: messages.join('\n'), theoremName, checker });
}

test('accepts a proof that only uses the standard axioms', () => {
  const result = run();
  assert.equal(result.valid, true);
  assert.equal(result.status, 'verified');
  assert.deepEqual(result.axioms, STANDARD);
  assert.ok(Object.values(result.policyChecks).every(Boolean));
  assert.equal(result.policyChecks.kernelChecked, true);
  assert.equal(result.policyVersion, 3);
});

test('accepts a proof that depends on no axioms', () => {
  const result = run({ checker: checked([]) });
  assert.equal(result.valid, true);
  assert.deepEqual(result.axioms, []);
});

test('rejects a proof whose checked axioms include sorryAx', () => {
  const result = run({ messages: [msg('warning', 3, 'declaration uses `sorry`')], checker: checked(['sorryAx']) });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.noSorry, false);
  assert.equal(result.policyChecks.allowedAxioms, false);
  assert.match(result.diagnostics.map((d) => d.message).join('\n'), /sorryAx/);
});

test('rejects custom axioms and native_decide (ofReduceBool) found by the checker', () => {
  for (const extra of ['cheat', 'Lean.ofReduceBool']) {
    const result = run({ checker: checked(['propext', extra]) });
    assert.equal(result.valid, false);
    assert.equal(result.policyChecks.allowedAxioms, false);
    assert.match(result.diagnostics.at(-1).message, new RegExp(extra.replace('.', '\\.')));
  }
});

test('rejects a proof the kernel replay refuses, even if it compiled cleanly', () => {
  const result = run({ checker: parseCheckerOutput({ exitCode: 1, stderr: "check failed: while replaying declaration 'and_swap': (kernel) declaration type mismatch" }) });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.kernelChecked, false);
  assert.equal(result.policyChecks.theoremChecked, false);
  assert.match(result.diagnostics.at(-1).message, /kernel\) declaration type mismatch/);
});

test('rejects proofs with non-linter warnings but tolerates linter warnings', () => {
  const linter = run({
    messages: [msg('warning', 3, 'unused variable `h`\nnote: this linter can be disabled with `set_option linter.unusedVariables false`', 'linter.unusedVariables')],
  });
  assert.equal(linter.valid, true);

  const other = run({ messages: [msg('warning', 4, 'this tactic is never executed')] });
  assert.equal(other.valid, false);
  assert.equal(other.policyChecks.noWarnings, false);
});

test('rejects compilation errors without running the checker', () => {
  const result = run({ exitCode: 1, messages: [msg('error', 5, 'unsolved goals\np q : Prop ? q ? p')], checker: null });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.noUnsolvedGoals, false);
  assert.equal(result.diagnostics[0].line, 5);
  assert.equal(result.diagnostics.length, 1);
});

test('fails closed when the checker did not run after a clean compile', () => {
  const result = run({ checker: null });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.kernelChecked, false);
  assert.match(result.diagnostics[0].message, /Could not check and_swap in the kernel/);
});

test('treats unstructured output as an error only when Lean failed', () => {
  const failed = run({ exitCode: 1, messages: ['error: unknown package Foo'], checker: null });
  assert.equal(failed.valid, false);
  assert.equal(failed.diagnostics[0].message, 'error: unknown package Foo');

  const ok = run({ messages: ['info: downloading cache'] });
  assert.equal(ok.valid, true);
});

test('parses the checker result line and its failures', () => {
  assert.deepEqual(
    parseCheckerOutput({ exitCode: 0, stdout: 'noise\n{"axioms":["propext"],"declarations":2,"theorem":"t"}\n' }),
    { ok: true, theorem: 't', axioms: ['propext'], declarations: 2 },
  );
  assert.deepEqual(parseCheckerOutput({ exitCode: 1, stderr: 'warning: x\ncheck failed: t is not a theorem\n' }), { ok: false, axioms: [], error: 'check failed: t is not a theorem' });
  assert.equal(parseCheckerOutput({ exitCode: 0, stdout: 'garbage' }).ok, false, 'no result line means no pass');
  assert.equal(parseCheckerOutput({ exitCode: 0, stdout: '{"axioms":"propext","theorem":"t"}' }).ok, false);
});

test('accepts a well-formed source', () => {
  assert.equal(validateSource(SOURCE, 'and_swap'), null);
});

for (const [name, source, pattern] of [
  ['sorry', SOURCE.replace('exact ⟨hq, hp⟩', 'sorry'), /sorry/],
  ['custom axioms', `${SOURCE}\naxiom cheat : False`, /axioms/],
  ['#eval at the start of a line', `${SOURCE}\n#eval 1`, /#eval/],
  ['#exit', `${SOURCE}\n#exit`, /#/],
  ['native_decide', SOURCE.replace('exact ⟨hq, hp⟩', 'native_decide'), /native/],
  ['metaprogramming', `${SOURCE}\nrun_cmd pure ()`, /Metaprogramming/],
  ['macros', `macro "cheat" : tactic => \`(tactic| sorry)\n${SOURCE}`, /String literals|Metaprogramming|sorry/],
  ['BaseIO', `${SOURCE}\ndef x : BaseIO Unit := pure ()`, /IO/],
  ['skipping kernel checks', `set_option debug.skipKernelTC true\n${SOURCE}`, /debug/],
  ['non-Mathlib imports', SOURCE.replace('import Mathlib', 'import Mathlib Lean.Elab'), /Import is not allowed: Lean.Elab|metaprogramming/],
  ['module-system headers', `module\n${SOURCE}`, /Module-system/],
  ['look-alike imports', SOURCE.replace('import Mathlib', 'import MathlibEvil'), /Import is not allowed/],
  [
    'an attribute-registered elaborator that fakes #print axioms',
    `import Mathlib\nopen Lean Elab Command in\n@[command_elab Lean.Parser.Command.printAxioms]\ndef fake : CommandElab := fun _ => pure ()\n${SOURCE.replace('import Mathlib\n', '')}`,
    /metaprogramming|Attributes/,
  ],
  [
    'elaborator attributes even without the Lean namespace',
    `${SOURCE}\n@[command_elab printAxioms] def fake := 0`,
    /Attributes are not allowed: command_elab/,
  ],
  ['init attributes', `${SOURCE}\n@[init] def x : Nat := 0`, /Attributes are not allowed: init/],
  ['attribute commands', `${SOURCE}\nattribute [tactic foo] bar`, /Attributes are not allowed: tactic/],
  ['adding declarations from a metaprogram', `${SOURCE}\ndef x := addDecl`, /metaprogramming/],
  ['syntax quotations', `${SOURCE}\ndef q := \`(tactic| rfl)`, /quotations/],
  ['custom notation', `${SOURCE}\nnotation:max "⊥⊥" => False`, /String literals|notation/],
  ['comment openers hidden in a string', `import Mathlib\ndef s := "--" elab_rules : command | _ => pure ()\n${SOURCE.replace('import Mathlib\n', '')}`, /String literals/],
  ['comment openers hidden in a «» name', `import Mathlib\ndef «--» := 0 run_cmd pure ()\n${SOURCE.replace('import Mathlib\n', '')}`, /«»/],
]) {
  test(`rejects ${name}`, () => {
    assert.match(validateSource(source, 'and_swap') || '', pattern);
  });
}

test('requires the named theorem to be declared', () => {
  assert.match(validateSource(SOURCE, 'missing_theorem'), /not declared/);
  assert.match(validateSource(SOURCE, 'bad name'), /theoremName/);
  assert.equal(declaresTheorem('@[simp] lemma foo : True := trivial', 'foo'), true);
  assert.equal(declaresTheorem('theorem foo_bar : True := trivial', 'foo'), false);
  assert.equal(declaresTheorem('-- theorem foo : True := trivial', 'foo'), false);
});

test('allows ordinary proof attributes', () => {
  const source = `import Mathlib\n@[simp] lemma helper (n : ℕ) : n + 0 = n := rfl\nattribute [local simp] Nat.add_comm\n${SOURCE.replace('import Mathlib\n', '')}`;
  assert.equal(validateSource(source, 'and_swap'), null);
});

test('treats deprecation warnings like linter warnings', () => {
  const result = run({
    messages: [msg('warning', 4, '`Nat.pos_of_ne_zero` has been deprecated: use `Nat.pos_iff_ne_zero` instead', 'Lean.Linter.deprecatedAttr')],
  });
  assert.equal(result.valid, true);
});

test('does not let a quote character inside a comment trip the string check', () => {
  assert.equal(validateSource(`${SOURCE}\n-- the "swap" lemma`, 'and_swap'), null);
  assert.equal(scanSource('a "x -- y" b').code, 'a   b');
});

test('ignores forbidden words inside comments', () => {
  const source = `${SOURCE}\n-- we do not use sorry here\n/- nor #eval /- nested -/ -/`;
  assert.equal(validateSource(source, 'and_swap'), null);
});

test('allows Mathlib finset-card notation such as #s', () => {
  const source = `import Mathlib\nopen Finset in\ntheorem card_ok (s : Finset ℕ) (h : #s = 2) : s.card = 2 := h\n`;
  assert.equal(validateSource(source, 'card_ok'), null);
});

test('collects every module from multi-module import lines', () => {
  assert.deepEqual(importedModules('import Mathlib.Data.Nat Mathlib.Tactic\nimport Mathlib'), ['Mathlib.Data.Nat', 'Mathlib.Tactic', 'Mathlib']);
  assert.equal(stripComments('a -- b\nc /- d -/ e'), 'a \nc  e');
});
