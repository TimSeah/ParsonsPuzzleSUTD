export const SUM_OF_FIRST_N_INTEGERS = {
  id: 'induction1',
  title: '\\text{Prove by induction: } \\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
  displayTitle: 'Prove by induction: Sum of first n integers',
  statement: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
  blocks: [
    { id: 'ind1-1', latex: '\\text{Proof by induction on } n \\ge 1.' },
    { id: 'ind1-2', latex: '\\textbf{Base case: } n = 1' },
    { id: 'ind1-3', latex: '\\text{LHS: } \\sum_{i=1}^{1} i = 1' },
    { id: 'ind1-4', latex: '\\text{RHS: } \\frac{1(1+1)}{2} = \\frac{2}{2} = 1' },
    { id: 'ind1-5', latex: '\\text{LHS = RHS, so the base case holds.}' },
    { id: 'ind1-6', latex: '\\textbf{Inductive step: } \\text{Assume the statement holds for } n = k \\text{, i.e., } \\sum_{i=1}^{k} i = \\frac{k(k+1)}{2}' },
    { id: 'ind1-7', latex: '\\text{We need to prove it holds for } n = k+1 \\text{, i.e., } \\sum_{i=1}^{k+1} i = \\frac{(k+1)(k+2)}{2}' },
    { id: 'ind1-8', latex: '\\text{LHS: } \\sum_{i=1}^{k+1} i = \\sum_{i=1}^{k} i + (k+1)' },
    { id: 'ind1-9', latex: '\\text{By the inductive hypothesis: } = \\frac{k(k+1)}{2} + (k+1)' },
    { id: 'ind1-10', latex: '= \\frac{k(k+1)}{2} + \\frac{2(k+1)}{2} = \\frac{k(k+1) + 2(k+1)}{2}' },
    { id: 'ind1-11', latex: '= \\frac{(k+1)(k+2)}{2} = \\text{RHS}' },
    { id: 'ind1-12', latex: '\\text{Therefore, by mathematical induction, the statement holds for all } n \\ge 1.' },
  ],
  solutionOrder: ['ind1-1', 'ind1-2', 'ind1-3', 'ind1-4', 'ind1-5', 'ind1-6', 'ind1-7', 'ind1-8', 'ind1-9', 'ind1-10', 'ind1-11', 'ind1-12']
};

export const SUM_OF_POWERS_OF_TWO = {
  id: 'induction2',
  title: '\\text{Prove by induction: } \\sum_{i=0}^{n} 2^i = 2^{n+1} - 1',
  displayTitle: 'Prove by induction: Sum of powers of 2',
  statement: '\\sum_{i=0}^{n} 2^i = 2^{n+1} - 1',
  blocks: [
    { id: 'ind2-1', latex: '\\text{Proof by induction on } n \\ge 0.' },
    { id: 'ind2-2', latex: '\\textbf{Base case: } n = 0' },
    { id: 'ind2-3', latex: '\\text{LHS: } \\sum_{i=0}^{0} 2^i = 2^0 = 1' },
    { id: 'ind2-4', latex: '\\text{RHS: } 2^{0+1} - 1 = 2^1 - 1 = 2 - 1 = 1' },
    { id: 'ind2-5', latex: '\\text{LHS = RHS, so the base case holds.}' },
    { id: 'ind2-6', latex: '\\textbf{Inductive step: } \\text{Assume the statement holds for } n = k \\text{, i.e., } \\sum_{i=0}^{k} 2^i = 2^{k+1} - 1' },
    { id: 'ind2-7', latex: '\\text{We need to prove it holds for } n = k+1 \\text{, i.e., } \\sum_{i=0}^{k+1} 2^i = 2^{k+2} - 1' },
    { id: 'ind2-8', latex: '\\text{LHS: } \\sum_{i=0}^{k+1} 2^i = \\sum_{i=0}^{k} 2^i + 2^{k+1}' },
    { id: 'ind2-9', latex: '\\text{By the inductive hypothesis: } = (2^{k+1} - 1) + 2^{k+1}' },
    { id: 'ind2-10', latex: '= 2^{k+1} - 1 + 2^{k+1} = 2 \\cdot 2^{k+1} - 1' },
    { id: 'ind2-11', latex: '= 2^{k+2} - 1 = \\text{RHS}' },
    { id: 'ind2-12', latex: '\\text{Therefore, by mathematical induction, the statement holds for all } n \\ge 0.' },
  ],
  solutionOrder: ['ind2-1', 'ind2-2', 'ind2-3', 'ind2-4', 'ind2-5', 'ind2-6', 'ind2-7', 'ind2-8', 'ind2-9', 'ind2-10', 'ind2-11', 'ind2-12']
};

export const DIVISIBILITY_BY_THREE = {
  id: 'induction3',
  title: '\\text{Prove by induction: } 4^n - 1 \\text{ is divisible by } 3 \\text{ for all } n \\ge 1',
  displayTitle: 'Prove by induction: 4^n - 1 divisible by 3',
  statement: '4^n - 1 \\text{ is divisible by } 3 \\text{ for all } n \\ge 1',
  blocks: [
    { id: 'ind3-1', latex: '\\text{Proof by induction on } n \\ge 1.' },
    { id: 'ind3-2', latex: '\\textbf{Base case: } n = 1' },
    { id: 'ind3-3', latex: '4^1 - 1 = 4 - 1 = 3' },
    { id: 'ind3-4', latex: '\\text{Since } 3 = 3 \\cdot 1 \\text{, it is divisible by } 3.' },
    { id: 'ind3-5', latex: '\\textbf{Inductive step: } \\text{Assume } 4^k - 1 \\text{ is divisible by } 3 \\text{ for some } k \\ge 1.' },
    { id: 'ind3-6', latex: '\\text{This means } 4^k - 1 = 3m \\text{ for some integer } m.' },
    { id: 'ind3-7', latex: '\\text{We need to prove } 4^{k+1} - 1 \\text{ is divisible by } 3.' },
    { id: 'ind3-8', latex: '4^{k+1} - 1 = 4 \\cdot 4^k - 1' },
    { id: 'ind3-9', latex: '= 4 \\cdot 4^k - 4 + 4 - 1 = 4(4^k - 1) + 3' },
    { id: 'ind3-10', latex: '\\text{By the inductive hypothesis, } 4^k - 1 = 3m \\text{, so:}' },
    { id: 'ind3-11', latex: '4^{k+1} - 1 = 4(3m) + 3 = 12m + 3 = 3(4m + 1)' },
    { id: 'ind3-12', latex: '\\text{Since } 4m + 1 \\text{ is an integer, } 4^{k+1} - 1 \\text{ is divisible by } 3.' },
    { id: 'ind3-13', latex: '\\text{Therefore, by mathematical induction, } 4^n - 1 \\text{ is divisible by } 3 \\text{ for all } n \\ge 1.' },
  ],
  solutionOrder: ['ind3-1', 'ind3-2', 'ind3-3', 'ind3-4', 'ind3-5', 'ind3-6', 'ind3-7', 'ind3-8', 'ind3-9', 'ind3-10', 'ind3-11', 'ind3-12', 'ind3-13']
};