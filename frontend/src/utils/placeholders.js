// Interactive symbol placeholders in puzzle steps.
//
// A step's LaTeX can contain placeholders such as {{op}} that students fill in
// by clicking a button that cycles through the symbols for that type. The
// correct symbol is written after a colon, with `|` between alternatives when
// more than one symbol makes the step true:
//
//   0 {{op:\leq}} f(n)        n {{op:\geq|>}} 1        f(n) = {{complexity:O}}(g(n))
//
// Selections are stored per step under `${type}_${index}`, where index counts
// every placeholder in the step from 0.

export const PLACEHOLDER_TYPES = {
  op: {
    label: 'Relation',
    choices: [
      { value: '<', symbol: '<', name: 'less than' },
      { value: '\\leq', symbol: '≤', name: 'less than or equal to' },
      { value: '=', symbol: '=', name: 'equal to' },
      { value: '\\geq', symbol: '≥', name: 'greater than or equal to' },
      { value: '>', symbol: '>', name: 'greater than' },
      { value: '\\neq', symbol: '≠', name: 'not equal to' },
    ],
  },
  complexity: {
    label: 'Bound',
    choices: [
      { value: 'O', symbol: 'O', name: 'big O (upper bound)' },
      { value: '\\Omega', symbol: 'Ω', name: 'big Omega (lower bound)' },
      { value: '\\Theta', symbol: 'Θ', name: 'big Theta (tight bound)' },
    ],
  },
  quantifier: {
    label: 'Quantifier',
    choices: [
      { value: '\\forall', symbol: '∀', name: 'for all' },
      { value: '\\exists', symbol: '∃', name: 'there exists' },
      { value: '\\exists!', symbol: '∃!', name: 'there exists exactly one' },
      { value: '\\nexists', symbol: '∄', name: 'there does not exist' },
    ],
  },
  logic: {
    label: 'Connective',
    choices: [
      { value: '\\land', symbol: '∧', name: 'and' },
      { value: '\\lor', symbol: '∨', name: 'or' },
      { value: '\\neg', symbol: '¬', name: 'not' },
    ],
  },
  setop: {
    label: 'Set relation',
    choices: [
      { value: '\\in', symbol: '∈', name: 'element of' },
      { value: '\\notin', symbol: '∉', name: 'not an element of' },
      { value: '\\subseteq', symbol: '⊆', name: 'subset of' },
      { value: '\\subset', symbol: '⊂', name: 'proper subset of' },
      { value: '\\supseteq', symbol: '⊇', name: 'superset of' },
      { value: '\\supset', symbol: '⊃', name: 'proper superset of' },
    ],
  },
  cupcap: {
    label: 'Set operation',
    choices: [
      { value: '\\cap', symbol: '∩', name: 'intersection' },
      { value: '\\cup', symbol: '∪', name: 'union' },
      { value: '\\setminus', symbol: '∖', name: 'set difference' },
    ],
  },
};

// Older puzzles used {{set}} for set relations.
const TYPE_ALIASES = { set: 'setop' };

// Accept common LaTeX spellings of the same symbol in written answers.
const SYMBOL_ALIASES = {
  '\\le': '\\leq',
  '\\ge': '\\geq',
  '\\ne': '\\neq',
  '\\lt': '<',
  '\\gt': '>',
  '\\wedge': '\\land',
  '\\vee': '\\lor',
  '\\lnot': '\\neg',
};

export const PLACEHOLDER_PATTERN = /\{\{(\w+)(?::([^{}]*))?\}\}/g;

export const normalizeType = (type) => TYPE_ALIASES[type] || type;

export const normalizeSymbol = (value) => {
  const trimmed = String(value ?? '').trim();
  return SYMBOL_ALIASES[trimmed] || trimmed;
};

export const getChoices = (type) => PLACEHOLDER_TYPES[normalizeType(type)]?.choices || [];

export const findChoice = (type, value) => {
  const normalized = normalizeSymbol(value);
  return getChoices(type).find((choice) => choice.value === normalized) || null;
};

export const describeType = (type) => PLACEHOLDER_TYPES[normalizeType(type)]?.label || 'Symbol';

/**
 * Lists the placeholders in a step, in order.
 * @returns {{type: string, key: string, index: number, answers: string[], start: number, end: number}[]}
 */
export const parsePlaceholders = (latex) => [...String(latex ?? '').matchAll(PLACEHOLDER_PATTERN)].map((match, index) => {
  const [raw, type, answerText] = match;
  return {
    type: normalizeType(type),
    key: `${type}_${index}`,
    index,
    answers: answerText === undefined
      ? []
      : answerText.split('|').map(normalizeSymbol).filter(Boolean),
    start: match.index,
    end: match.index + raw.length,
  };
});

// Unselected → first symbol → … → last symbol → first symbol again.
export const nextChoice = (type, current) => {
  const choices = getChoices(type);
  if (choices.length === 0) return current;
  const index = choices.findIndex((choice) => choice.value === normalizeSymbol(current));
  return choices[(index + 1) % choices.length].value;
};

/**
 * Checks a step's selected symbols against its answers. Placeholders without
 * an answer are not graded.
 */
export const checkSymbols = (latex, selections = {}) => {
  const graded = parsePlaceholders(latex).filter((placeholder) => placeholder.answers.length > 0);
  const wrong = graded.filter((placeholder) => {
    const selected = selections[placeholder.key];
    return selected === undefined || !placeholder.answers.includes(normalizeSymbol(selected));
  });
  return {
    total: graded.length,
    correct: graded.length - wrong.length,
    wrongKeys: wrong.map((placeholder) => placeholder.key),
    isCorrect: wrong.length === 0,
  };
};

// The selections that solve a step (the first accepted answer for each placeholder).
export const answerSelections = (latex) => Object.fromEntries(
  parsePlaceholders(latex)
    .filter((placeholder) => placeholder.answers.length > 0)
    .map((placeholder) => [placeholder.key, placeholder.answers[0]]),
);

/**
 * Problems an author needs to fix in a step: unknown placeholder types,
 * missing answers, and answers that aren't one of the type's symbols.
 */
export const placeholderProblems = (latex) => parsePlaceholders(latex).flatMap((placeholder) => {
  const choices = getChoices(placeholder.type);
  const written = `{{${placeholder.key.split('_')[0]}}}`;
  if (choices.length === 0) {
    return [`${written} isn't a known placeholder. Use ${Object.keys(PLACEHOLDER_TYPES).map((type) => `{{${type}}}`).join(', ')}.`];
  }
  if (placeholder.answers.length === 0) {
    return [`${written} needs an answer, for example {{${placeholder.type}:${choices[0].value}}}.`];
  }
  const unknown = placeholder.answers.filter((answer) => !choices.some((choice) => choice.value === answer));
  return unknown.length > 0
    ? [`${unknown.join(', ')} isn't a choice for ${written}. Use one of: ${choices.map((choice) => choice.value).join(' ')}.`]
    : [];
});
