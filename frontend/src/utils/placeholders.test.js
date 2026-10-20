import { describe, expect, it } from 'vitest';
import {
  answerSelections,
  checkSymbols,
  nextChoice,
  parsePlaceholders,
  placeholderProblems,
} from './placeholders.js';

describe('parsePlaceholders', () => {
  it('reads types, keys and answers in order, with alternatives and aliases', () => {
    const found = parsePlaceholders('0 {{op:\\le}} f(n) {{op:\\leq|<}} g(n), x {{set:\\in}} A, {{complexity}}');
    expect(found.map(({ type, key, answers }) => ({ type, key, answers }))).toEqual([
      { type: 'op', key: 'op_0', answers: ['\\leq'] },
      { type: 'op', key: 'op_1', answers: ['\\leq', '<'] },
      { type: 'setop', key: 'set_2', answers: ['\\in'] },
      { type: 'complexity', key: 'complexity_3', answers: [] },
    ]);
  });
});

describe('nextChoice', () => {
  it('starts at the first symbol and wraps around after the last', () => {
    expect(nextChoice('complexity', undefined)).toBe('O');
    expect(nextChoice('complexity', 'O')).toBe('\\Omega');
    expect(nextChoice('complexity', '\\Omega')).toBe('\\Theta');
    expect(nextChoice('complexity', '\\Theta')).toBe('O');
  });
});

describe('checkSymbols', () => {
  const latex = 'n {{op:\\geq}} 1, f = {{complexity:O|\\Theta}}(g), {{logic}}';

  it('requires every answered placeholder to match, and ignores unanswered ones', () => {
    expect(checkSymbols(latex, {}).wrongKeys).toEqual(['op_0', 'complexity_1']);
    expect(checkSymbols(latex, { op_0: '\\geq', complexity_1: '\\Omega' }).wrongKeys).toEqual(['complexity_1']);
    expect(checkSymbols(latex, { op_0: '\\ge', complexity_1: '\\Theta' })).toMatchObject({ isCorrect: true, total: 2, correct: 2 });
  });

  it('treats steps without placeholders as correct', () => {
    expect(checkSymbols('\\text{plain}', {}).isCorrect).toBe(true);
  });

  it('builds the selections that solve a step', () => {
    expect(answerSelections(latex)).toEqual({ op_0: '\\geq', complexity_1: 'O' });
    expect(checkSymbols(latex, answerSelections(latex)).isCorrect).toBe(true);
  });
});

describe('placeholderProblems', () => {
  it('accepts placeholders with valid answers', () => {
    expect(placeholderProblems('0 {{op:\\leq}} n, {{cupcap:\\cap}}, {{quantifier:\\forall}}')).toEqual([]);
  });

  it('reports missing answers, unknown answers and unknown types', () => {
    expect(placeholderProblems('{{op}}')[0]).toMatch(/needs an answer, for example \{\{op:<\}\}/);
    expect(placeholderProblems('{{complexity:\\omega}}')[0]).toMatch(/\\omega isn't a choice/);
    expect(placeholderProblems('{{relation:=}}')[0]).toMatch(/isn't a known placeholder/);
  });
});
