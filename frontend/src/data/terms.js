// Dictionary terms for Math & Programming concepts
// Organized by category for better maintainability

const BIG_O_TERMS = [
  { term: "Big O", definition: "Notation to describe the upper bound time or space complexity of an algorithm." },
  { term: "Theta Notation", definition: "Θ(n) - Tight bound for asymptotic analysis, representing both upper and lower bounds." },
  { term: "Omega Notation", definition: "Ω(n) - Lower bound for asymptotic analysis, representing the best-case scenario." },
  { term: "Algorithm", definition: "A step-by-step procedure for solving a computational problem." },
  { term: "Time Complexity", definition: "A measure of the amount of time an algorithm takes to complete as a function of input size." },
  { term: "Space Complexity", definition: "A measure of the amount of memory space an algorithm uses as a function of input size." },
  { term: "Asymptotic Analysis", definition: "Mathematical analysis of algorithms' efficiency as input size approaches infinity." },
  { term: "Upper Bound", definition: "The maximum amount of resources (time/space) an algorithm will use." },
  { term: "Lower Bound", definition: "The minimum amount of resources (time/space) an algorithm will use." },
  { term: "Tight Bound", definition: "When upper and lower bounds are the same, giving exact growth rate." },
];

const MATHEMATICAL_INDUCTION_TERMS = [
  { term: "Mathematical Induction", definition: "A proof technique that proves a statement for all natural numbers by proving a base case and inductive step." },
  { term: "Base Case", definition: "The initial step in mathematical induction, usually proving the statement for n=0 or n=1." },
  { term: "Inductive Step", definition: "Proving that if P(k) is true, then P(k+1) is also true, completing the induction." },
  { term: "Inductive Hypothesis", definition: "The assumption that the statement P(k) is true for some arbitrary k." },
  { term: "Strong Induction", definition: "A variant where we assume P(j) is true for all j ≤ k to prove P(k+1)." },
  { term: "Principle of Mathematical Induction", definition: "If P(1) is true and P(k) → P(k+1), then P(n) is true for all n ≥ 1." },
];

const SET_THEORY_TERMS = [
  { term: "Set Theory", definition: "A branch of mathematics dealing with collections of objects called sets." },
  { term: "Union", definition: "A ∪ B - The set containing all elements that are in A or B (or both)." },
  { term: "Intersection", definition: "A ∩ B - The set containing all elements that are in both A and B." },
  { term: "Subset", definition: "A ⊆ B - All elements of A are also elements of B." },
  { term: "Proper Subset", definition: "A ⊂ B - A is a subset of B and A ≠ B." },
  { term: "Complement", definition: "A̅ or A' - The set of all elements not in A (relative to a universal set)." },
  { term: "Universal Set", definition: "The set containing all objects under consideration in a particular context." },
  { term: "Empty Set", definition: "∅ - The set containing no elements." },
  { term: "De Morgan's Laws", definition: "(A ∪ B)' = A' ∩ B' and (A ∩ B)' = A' ∪ B' - Rules for complements of unions and intersections." },
  { term: "Distributive Law", definition: "A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C) - Distribution of intersection over union." },
  { term: "Associative Law", definition: "(A ∪ B) ∪ C = A ∪ (B ∪ C) - Grouping doesn't matter in unions (same for intersections)." },
  { term: "Commutative Law", definition: "A ∪ B = B ∪ A - Order doesn't matter in unions (same for intersections)." },
  { term: "Idempotent Law", definition: "A ∪ A = A and A ∩ A = A - Combining a set with itself yields the same set." },
];

const RECURSION_TERMS = [
  { term: "Recursion", definition: "A programming technique where a function calls itself to solve smaller instances of the same problem." },
  { term: "Base Case", definition: "In recursion, the condition that stops the recursive calls and provides a direct answer." },
  { term: "Recursive Case", definition: "The part of a recursive function that calls itself with a smaller or simpler input." },
  { term: "Stack Overflow", definition: "An error that occurs when recursive calls exceed the call stack's capacity." },
  { term: "Tail Recursion", definition: "A special form of recursion where the recursive call is the last operation in the function." },
  { term: "Tree Recursion", definition: "Recursion where a function makes multiple recursive calls, forming a tree-like structure." },
  { term: "Memoization", definition: "An optimization technique that stores the results of expensive recursive calls." },
];

const PROOF_TECHNIQUES_TERMS = [
  { term: "Direct Proof", definition: "A straightforward proof that starts with given assumptions and derives the conclusion step by step." },
  { term: "Proof by Contradiction", definition: "Assume the opposite of what you want to prove and show it leads to a logical contradiction." },
  { term: "Proof by Contrapositive", definition: "To prove P → Q, instead prove ¬Q → ¬P (the contrapositive)." },
  { term: "Constructive Proof", definition: "A proof that demonstrates existence by explicitly constructing the object." },
  { term: "Proof by Cases", definition: "Breaking the proof into exhaustive cases and proving each case separately." },
  { term: "Lemma", definition: "A preliminary result used to prove a more important theorem." },
  { term: "Theorem", definition: "A statement that has been proven to be true based on axioms and other theorems." },
  { term: "Corollary", definition: "A result that follows easily from a previously proven theorem." },
];

const DATA_STRUCTURES_TERMS = [
  { term: "Data Structure", definition: "A way of organizing and storing data to enable efficient access and modification." },
  { term: "Stack", definition: "A LIFO (Last In, First Out) data structure supporting push and pop operations." },
  { term: "Queue", definition: "A FIFO (First In, First Out) data structure supporting enqueue and dequeue operations." },
  { term: "Array", definition: "An ordered collection of elements stored in contiguous memory locations." },
  { term: "Linked List", definition: "A linear data structure where elements are linked using pointers." },
  { term: "Binary Tree", definition: "A tree data structure where each node has at most two children (left and right)." },
  { term: "Hash Table", definition: "A data structure that maps keys to values using a hash function for O(1) average lookup." },
  { term: "Graph", definition: "A collection of vertices (nodes) connected by edges." },
];

const PROGRAMMING_FUNDAMENTALS_TERMS = [
  { term: "Function", definition: "A reusable block of code that performs a specific task and can return a value." },
  { term: "Variable", definition: "A named storage location that holds a value that can be changed during program execution." },
  { term: "Loop", definition: "A programming construct that repeats a block of code until a condition is met." },
  { term: "Conditional", definition: "A programming construct that executes different code based on whether a condition is true or false." },
  { term: "Object", definition: "A data structure that contains both data (attributes) and code (methods)." },
  { term: "Class", definition: "A blueprint or template for creating objects with shared attributes and methods." },
  { term: "Inheritance", definition: "A mechanism where one class acquires properties and behaviors from another class." },
  { term: "Encapsulation", definition: "The bundling of data and methods that operate on that data within a single unit." },
  { term: "Polymorphism", definition: "The ability of different classes to be treated as instances of the same type through inheritance." },
];

const COMPUTER_SCIENCE_THEORY_TERMS = [
  { term: "Turing Machine", definition: "A theoretical model of computation that manipulates symbols on an infinite tape." },
  { term: "Decidability", definition: "Whether there exists an algorithm that can determine if a given problem has a solution." },
  { term: "NP-Complete", definition: "A class of problems that are both in NP and every problem in NP reduces to them." },
  { term: "P vs NP", definition: "The question of whether problems with polynomial-time verifiable solutions also have polynomial-time algorithms." },
  { term: "Halting Problem", definition: "The undecidable problem of determining whether an arbitrary program will halt or run forever." },
];

const MATHEMATICAL_CONCEPTS_TERMS = [
  { term: "Logarithm", definition: "The power to which a base must be raised to produce a given number (log₂(8) = 3)." },
  { term: "Fibonacci Sequence", definition: "A sequence where each number is the sum of the two preceding ones: 0, 1, 1, 2, 3, 5, 8, ..." },
  { term: "Prime Number", definition: "A natural number greater than 1 that has no positive divisors other than 1 and itself." },
  { term: "Modular Arithmetic", definition: "A system of arithmetic for integers where numbers wrap around after reaching a modulus." },
  { term: "Combinatorics", definition: "The branch of mathematics dealing with counting, arrangement, and combination of objects." },
  { term: "Permutation", definition: "An arrangement of objects in a specific order." },
  { term: "Combination", definition: "A selection of objects without regard to order." },
];

const LOGIC_TERMS = [
  { term: "Propositional Logic", definition: "A branch of logic dealing with propositions that are either true or false." },
  { term: "Predicate Logic", definition: "An extension of propositional logic that deals with predicates and quantifiers." },
  { term: "Universal Quantifier", definition: "∀ - 'For all' - indicates a property holds for every element in a domain." },
  { term: "Existential Quantifier", definition: "∃ - 'There exists' - indicates at least one element has a certain property." },
  { term: "Logical Conjunction", definition: "∧ - 'AND' - true only when both operands are true." },
  { term: "Logical Disjunction", definition: "∨ - 'OR' - true when at least one operand is true." },
  { term: "Logical Negation", definition: "¬ - 'NOT' - reverses the truth value of a proposition." },
  { term: "Logical Implication", definition: "→ - 'If...then' - false only when antecedent is true and consequent is false." },
];

const PROGRAMMING_PARADIGMS_TERMS = [
  { term: "Imperative Programming", definition: "A programming paradigm that describes computation as statements that change program state." },
  { term: "Functional Programming", definition: "A programming paradigm that treats computation as evaluation of mathematical functions." },
  { term: "Object-Oriented Programming", definition: "A programming paradigm based on objects that contain data and code." },
  { term: "Declarative Programming", definition: "A programming paradigm that expresses logic without describing control flow." },
];

// Combine all terms into a single array
export const DICTIONARY_TERMS = [
  ...BIG_O_TERMS,
  ...MATHEMATICAL_INDUCTION_TERMS,
  ...SET_THEORY_TERMS,
  ...RECURSION_TERMS,
  ...PROOF_TECHNIQUES_TERMS,
  ...DATA_STRUCTURES_TERMS,
  ...PROGRAMMING_FUNDAMENTALS_TERMS,
  ...COMPUTER_SCIENCE_THEORY_TERMS,
  ...MATHEMATICAL_CONCEPTS_TERMS,
  ...LOGIC_TERMS,
  ...PROGRAMMING_PARADIGMS_TERMS,
];

// Export individual categories for potential future use
export const TERM_CATEGORIES = {
  BIG_O: BIG_O_TERMS,
  MATHEMATICAL_INDUCTION: MATHEMATICAL_INDUCTION_TERMS,
  SET_THEORY: SET_THEORY_TERMS,
  RECURSION: RECURSION_TERMS,
  PROOF_TECHNIQUES: PROOF_TECHNIQUES_TERMS,
  DATA_STRUCTURES: DATA_STRUCTURES_TERMS,
  PROGRAMMING_FUNDAMENTALS: PROGRAMMING_FUNDAMENTALS_TERMS,
  COMPUTER_SCIENCE_THEORY: COMPUTER_SCIENCE_THEORY_TERMS,
  MATHEMATICAL_CONCEPTS: MATHEMATICAL_CONCEPTS_TERMS,
  LOGIC: LOGIC_TERMS,
  PROGRAMMING_PARADIGMS: PROGRAMMING_PARADIGMS_TERMS,
};

export default DICTIONARY_TERMS;
