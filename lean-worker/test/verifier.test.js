import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCheckedSource,
  declaresTheorem,
  evaluate,
  importedModules,
  parseAxioms,
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

function run({ exitCode = 0, messages = [], theoremName = 'and_swap', source = SOURCE } = {}) {
  const { axiomsLine } = buildCheckedSource(source, theoremName);
  return evaluate({ exitCode, output: messages.map((m) => (typeof m === 'function' ? m(axiomsLine) : m)).join('\n'), theoremName, axiomsLine });
}

const axiomsInfo = (text) => (line) => msg('information', line, text);

test('accepts a proof that only uses the standard axioms', () => {
  const result = run({ messages: [axiomsInfo("'and_swap' depends on axioms: [propext, Classical.choice, Quot.sound]")] });
  assert.equal(result.valid, true);
  assert.equal(result.status, 'verified');
  assert.deepEqual(result.axioms, ['propext', 'Classical.choice', 'Quot.sound']);
  assert.ok(Object.values(result.policyChecks).every(Boolean));
});

test('accepts a proof that depends on no axioms', () => {
  const result = run({ messages: [axiomsInfo("'and_swap' does not depend on any axioms")] });
  assert.equal(result.valid, true);
  assert.deepEqual(result.axioms, []);
});

test('rejects a proof that compiles but depends on sorryAx', () => {
  const result = run({
    messages: [
      msg('warning', 3, "declaration uses 'sorry'"),
      axiomsInfo("'and_swap' depends on axioms: [sorryAx]"),
    ],
  });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.noSorry, false);
  assert.equal(result.policyChecks.allowedAxioms, false);
  assert.match(result.diagnostics.map((d) => d.message).join('\n'), /sorryAx/);
});

test('rejects native_decide style proofs that trust the compiler', () => {
  const result = run({ messages: [axiomsInfo("'and_swap' depends on axioms: [propext, Lean.ofReduceBool]")] });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.allowedAxioms, false);
});

test('rejects proofs with non-linter warnings but tolerates linter warnings', () => {
  const linter = run({
    messages: [
      msg('warning', 3, 'unused variable `h`\nnote: this linter can be disabled with `set_option linter.unusedVariables false`', 'linter.unusedVariables'),
      axiomsInfo("'and_swap' does not depend on any axioms"),
    ],
  });
  assert.equal(linter.valid, true);

  const other = run({
    messages: [msg('warning', 4, 'this tactic is never executed'), axiomsInfo("'and_swap' does not depend on any axioms")],
  });
  assert.equal(other.valid, false);
  assert.equal(other.policyChecks.noWarnings, false);
});

test('rejects compilation errors', () => {
  const result = run({ exitCode: 1, messages: [msg('error', 5, 'unsolved goals\np q : Prop ⊢ q ∧ p')] });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.noUnsolvedGoals, false);
  assert.equal(result.diagnostics[0].line, 5);
});

test('rejects when the axioms report is missing (e.g. #exit stopped processing)', () => {
  const result = run({ messages: [] });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.theoremChecked, false);
  assert.match(result.diagnostics[0].message, /Could not confirm the axioms/);
});

test('ignores a spoofed axioms report printed before the appended check', () => {
  const result = run({ messages: [msg('information', 2, "'and_swap' does not depend on any axioms")] });
  assert.equal(result.valid, false);
  assert.equal(result.policyChecks.theoremChecked, false);
});

test('treats unstructured output as an error only when Lean failed', () => {
  const failed = run({ exitCode: 1, messages: ['error: unknown package Foo'] });
  assert.equal(failed.valid, false);
  assert.equal(failed.diagnostics[0].message, 'error: unknown package Foo');

  const ok = run({ messages: ['info: downloading cache', axiomsInfo("'and_swap' does not depend on any axioms")] });
  assert.equal(ok.valid, true);
});

test('parses #print axioms messages for the right theorem only', () => {
  assert.deepEqual(parseAxioms("'t' depends on axioms: [propext]", 't'), ['propext']);
  assert.deepEqual(parseAxioms("'t' does not depend on any axioms", 't'), []);
  assert.equal(parseAxioms("'other' does not depend on any axioms", 't'), null);
  assert.equal(parseAxioms('hello', 't'), null);
});

test('appends #print axioms after the source and reports its line', () => {
  const { text, axiomsLine } = buildCheckedSource('import Mathlib\ntheorem t : True := trivial\n\n', 't');
  assert.equal(text.split('\n')[axiomsLine - 1], '#print axioms t');
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
    messages: [
      msg('warning', 4, '`Nat.pos_of_ne_zero` has been deprecated: use `Nat.pos_iff_ne_zero` instead', 'Lean.Linter.deprecatedAttr'),
      axiomsInfo("'and_swap' does not depend on any axioms"),
    ],
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
