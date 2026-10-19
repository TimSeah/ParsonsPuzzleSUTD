# Sample Puzzles for Testing

This file contains sample puzzles that can be used to test the educator puzzle creation functionality. Each sample includes all the necessary information to create a complete puzzle.

## How to Use These Samples

1. Navigate to the Educator mode (`/educator`)
2. Click "Create New Puzzle" 
3. Copy and paste the information from any sample below
4. Test the drag-and-drop functionality by reordering blocks
5. Use preview mode to see how students will experience the puzzle
6. Publish to test the server integration

---

## Sample 1: Big O Notation - Polynomial Bound

**Category:** Big O Notation

**LaTeX Title:**
```latex
\text{Prove that } 3n^2 + 5n + 1 = O(n^2)
```

**Display Title:**
```
Prove that 3n² + 5n + 1 = O(n²)
```

**Statement:**
```latex
3n^2 + 5n + 1 = O(n^2)
```

**Difficulty:** Medium

**Tags:** big-o, asymptotic-analysis, polynomial

**Proof Blocks:**

1. `\text{To show } f(n) = O(g(n)), \text{ we need to find positive constants } c \text{ and } n_0 \text{ such that } 0 \leq f(n) \leq c \cdot g(n) \text{ for all } n \geq n_0.`

2. `\text{Consider } f(n) = 3n^2 + 5n + 1 \text{ and } g(n) = n^2.`

3. `\text{We need to show that } 3n^2 + 5n + 1 \leq c \cdot n^2 \text{ for some constants } c \text{ and } n_0.`

4. `\text{For } n \geq 1, \text{ we have } 5n \leq 5n^2 \text{ and } 1 \leq n^2.`

5. `\text{Therefore: } 3n^2 + 5n + 1 \leq 3n^2 + 5n^2 + n^2 = 9n^2`

6. `\text{So we can choose } c = 9 \text{ and } n_0 = 1.`

7. `\text{This gives us } 3n^2 + 5n + 1 \leq 9n^2 \text{ for all } n \geq 1.`

8. `\text{Therefore, } 3n^2 + 5n + 1 = O(n^2).`

---

## Sample 2: Mathematical Induction - Simple Sum

**Category:** Mathematical Induction

**LaTeX Title:**
```latex
\text{Prove by induction: } \sum_{i=1}^{n} (2i-1) = n^2
```

**Display Title:**
```
Prove by induction: Sum of first n odd numbers equals n²
```

**Statement:**
```latex
\sum_{i=1}^{n} (2i-1) = n^2 \text{ for all } n \geq 1
```

**Difficulty:** Easy

**Tags:** induction, summation, arithmetic-series

**Proof Blocks:**

1. `\textbf{Proof by induction on } n \geq 1.`

2. `\textbf{Base case: } n = 1`

3. `\text{LHS: } \sum_{i=1}^{1} (2i-1) = 2(1) - 1 = 1`

4. `\text{RHS: } 1^2 = 1`

5. `\text{LHS = RHS, so the base case holds.}`

6. `\textbf{Inductive hypothesis: } \text{Assume } \sum_{i=1}^{k} (2i-1) = k^2 \text{ for some } k \geq 1.`

7. `\textbf{Inductive step: } \text{We need to prove } \sum_{i=1}^{k+1} (2i-1) = (k+1)^2.`

8. `\text{LHS: } \sum_{i=1}^{k+1} (2i-1) = \sum_{i=1}^{k} (2i-1) + (2(k+1)-1)`

9. `\text{By the inductive hypothesis: } = k^2 + (2k+1)`

10. `= k^2 + 2k + 1 = (k+1)^2 = \text{RHS}`

11. `\text{Therefore, by mathematical induction, } \sum_{i=1}^{n} (2i-1) = n^2 \text{ for all } n \geq 1.`

---

## Sample 3: Set Theory - De Morgan's Law

**Category:** Set Theory

**LaTeX Title:**
```latex
\text{Prove: } \overline{A \cap B} = \overline{A} \cup \overline{B}
```

**Display Title:**
```
Prove: De Morgan's Law - Complement of Intersection
```

**Statement:**
```latex
\overline{A \cap B} = \overline{A} \cup \overline{B}
```

**Difficulty:** Medium

**Tags:** set-theory, de-morgan-law, complement, intersection, union

**Proof Blocks:**

1. `\text{To prove set equality, we show that each side is a subset of the other.}`

2. `\textbf{Part 1: } \overline{A \cap B} \subseteq \overline{A} \cup \overline{B}`

3. `\text{Let } x \in \overline{A \cap B}.`

4. `\text{Then } x \notin A \cap B.`

5. `\text{This means } x \notin A \text{ or } x \notin B \text{ (or both).}`

6. `\text{Case 1: If } x \notin A, \text{ then } x \in \overline{A}, \text{ so } x \in \overline{A} \cup \overline{B}.`

7. `\text{Case 2: If } x \notin B, \text{ then } x \in \overline{B}, \text{ so } x \in \overline{A} \cup \overline{B}.`

8. `\text{Therefore, } x \in \overline{A} \cup \overline{B}.`

9. `\textbf{Part 2: } \overline{A} \cup \overline{B} \subseteq \overline{A \cap B}`

10. `\text{Let } x \in \overline{A} \cup \overline{B}.`

11. `\text{Then } x \in \overline{A} \text{ or } x \in \overline{B}.`

12. `\text{This means } x \notin A \text{ or } x \notin B.`

13. `\text{Therefore, } x \notin A \cap B, \text{ so } x \in \overline{A \cap B}.`

14. `\text{Therefore, } \overline{A \cap B} = \overline{A} \cup \overline{B}.`

---

## Sample 4: Recursion - Fibonacci Growth

**Category:** Recursion

**LaTeX Title:**
```latex
\text{Prove: } F_n \geq \left(\frac{3}{2}\right)^{n-2} \text{ for } n \geq 3
```

**Display Title:**
```
Prove: Fibonacci numbers grow exponentially
```

**Statement:**
```latex
F_n \geq \left(\frac{3}{2}\right)^{n-2} \text{ for all } n \geq 3
```

**Difficulty:** Hard

**Tags:** recursion, fibonacci, exponential, strong-induction

**Proof Blocks:**

1. `\text{We use strong induction on } n \geq 3.`

2. `\textbf{Base cases:}`

3. `n = 3: F_3 = 2 \text{ and } \left(\frac{3}{2}\right)^{3-2} = \frac{3}{2} = 1.5`

4. `\text{Since } 2 > 1.5, \text{ the base case } n = 3 \text{ holds.}`

5. `n = 4: F_4 = 3 \text{ and } \left(\frac{3}{2}\right)^{4-2} = \left(\frac{3}{2}\right)^2 = 2.25`

6. `\text{Since } 3 > 2.25, \text{ the base case } n = 4 \text{ holds.}`

7. `\textbf{Inductive hypothesis:} \text{ Assume } F_k \geq \left(\frac{3}{2}\right)^{k-2} \text{ for all } 3 \leq k \leq n.`

8. `\textbf{Inductive step:} \text{ We need to prove } F_{n+1} \geq \left(\frac{3}{2}\right)^{(n+1)-2} = \left(\frac{3}{2}\right)^{n-1}.`

9. `\text{By the Fibonacci recurrence: } F_{n+1} = F_n + F_{n-1}`

10. `\text{By the inductive hypothesis: } F_n \geq \left(\frac{3}{2}\right)^{n-2} \text{ and } F_{n-1} \geq \left(\frac{3}{2}\right)^{n-3}`

11. `\text{Therefore: } F_{n+1} \geq \left(\frac{3}{2}\right)^{n-2} + \left(\frac{3}{2}\right)^{n-3}`

12. `= \left(\frac{3}{2}\right)^{n-3} \left(\frac{3}{2} + 1\right) = \left(\frac{3}{2}\right)^{n-3} \cdot \frac{5}{2}`

13. `\text{Since } \frac{5}{2} = 2.5 > \frac{9}{4} = 2.25 = \left(\frac{3}{2}\right)^2, \text{ we have:}`

14. `F_{n+1} > \left(\frac{3}{2}\right)^{n-3} \cdot \left(\frac{3}{2}\right)^2 = \left(\frac{3}{2}\right)^{n-1}`

15. `\text{Therefore, by strong induction, } F_n \geq \left(\frac{3}{2}\right)^{n-2} \text{ for all } n \geq 3.`

---

## Sample 5: Big O - Logarithmic Comparison

**Category:** Big O Notation

**LaTeX Title:**
```latex
\text{Prove that } \log_2(n!) = O(n \log n)
```

**Display Title:**
```
Prove that log(n!) = O(n log n)
```

**Statement:**
```latex
\log_2(n!) = O(n \log_2 n)
```

**Difficulty:** Hard

**Tags:** big-o, logarithm, factorial, stirling-approximation

**Proof Blocks:**

1. `\text{We need to show } \log_2(n!) \leq c \cdot n \log_2 n \text{ for some constants } c \text{ and } n_0.`

2. `\text{First, note that } \log_2(n!) = \log_2(1 \cdot 2 \cdot 3 \cdots n) = \sum_{i=1}^{n} \log_2 i`

3. `\text{For } i \geq \frac{n}{2}, \text{ we have } \log_2 i \geq \log_2\left(\frac{n}{2}\right) = \log_2 n - 1`

4. `\text{There are } \frac{n}{2} \text{ terms with } i \geq \frac{n}{2}, \text{ so:}`

5. `\sum_{i=n/2}^{n} \log_2 i \geq \frac{n}{2} \cdot (\log_2 n - 1)`

6. `\text{Also, for all } i \leq n: \log_2 i \leq \log_2 n`

7. `\text{Therefore: } \log_2(n!) = \sum_{i=1}^{n} \log_2 i \leq n \cdot \log_2 n`

8. `\text{Taking } c = 1 \text{ and } n_0 = 1, \text{ we have:}`

9. `\log_2(n!) \leq 1 \cdot n \log_2 n \text{ for all } n \geq 1`

10. `\text{Therefore, } \log_2(n!) = O(n \log_2 n).`

---

## Sample 6: Induction - Inequality

**Category:** Mathematical Induction

**LaTeX Title:**
```latex
\text{Prove by induction: } 2^n > n^2 \text{ for } n \geq 5
```

**Display Title:**
```
Prove by induction: 2ⁿ > n² for n ≥ 5
```

**Statement:**
```latex
2^n > n^2 \text{ for all } n \geq 5
```

**Difficulty:** Medium

**Tags:** induction, exponential, inequality

**Proof Blocks:**

1. `\text{Proof by induction on } n \geq 5.`

2. `\textbf{Base case: } n = 5`

3. `\text{LHS: } 2^5 = 32`

4. `\text{RHS: } 5^2 = 25`

5. `\text{Since } 32 > 25, \text{ the base case holds.}`

6. `\textbf{Inductive hypothesis: } \text{Assume } 2^k > k^2 \text{ for some } k \geq 5.`

7. `\textbf{Inductive step: } \text{We need to prove } 2^{k+1} > (k+1)^2.`

8. `2^{k+1} = 2 \cdot 2^k > 2 \cdot k^2 \text{ (by the inductive hypothesis)}`

9. `\text{We need to show } 2k^2 > (k+1)^2 = k^2 + 2k + 1`

10. `\text{This is equivalent to showing } 2k^2 > k^2 + 2k + 1`

11. `\text{Rearranging: } k^2 - 2k - 1 > 0`

12. `\text{For } k \geq 5: k^2 - 2k - 1 = k(k-2) - 1 \geq 5 \cdot 3 - 1 = 14 > 0`

13. `\text{Therefore, } 2^{k+1} > (k+1)^2.`

14. `\text{By mathematical induction, } 2^n > n^2 \text{ for all } n \geq 5.`

---

## Testing Tips

1. **Try Different Orders**: Test the drag-and-drop by intentionally placing blocks in the wrong order first
2. **Test LaTeX Rendering**: Verify that all mathematical expressions render correctly
3. **Check Tags**: Make sure the suggested tags work and custom tags can be added
4. **Preview Mode**: Always test the preview to ensure the student experience is good
5. **Server Integration**: Test both online (with server) and offline (localStorage fallback) modes
6. **Mobile Testing**: Check how the puzzles work on smaller screens

## Common LaTeX Patterns

- Text blocks: `\text{Your text here}`
- Fractions: `\frac{numerator}{denominator}`
- Subscripts/Superscripts: `x_i`, `n^2`
- Greek letters: `\alpha`, `\beta`, `\gamma`, `\Theta`, `\Omega`
- Operators: `\leq`, `\geq`, `\neq`, `\in`, `\notin`, `\subseteq`
- Logic: `\land` (and), `\lor` (or), `\neg` (not), `\forall`, `\exists`
- Sets: `\cap` (intersection), `\cup` (union), `\overline{A}` (complement)

These samples should provide comprehensive testing coverage for all major features of the educator interface!
