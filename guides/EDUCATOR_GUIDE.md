# Educator Guide: Creating Mathematical Proof Puzzles

This guide explains how educators can use the puzzle creation system to create interactive mathematical proof puzzles for students.

## Getting Started

1. Navigate to the **Educator** section from the navigation menu
2. Click on any of the **Quick Actions** buttons or use **Create New Puzzle** to start

## Creating a Puzzle

### Step 1: Basic Information
Fill out the essential puzzle details:

- **Category**: Choose from Big O Notation, Mathematical Induction, Recursion, or Set Theory
- **LaTeX Title**: Mathematical title using LaTeX syntax (e.g., `\text{Prove } n^2 + n^3 = \Theta(n^3)`)
- **Display Title**: Plain text version for accessibility (e.g., "Prove n² + n³ = Θ(n³)")
- **Statement**: The mathematical statement to prove (LaTeX format)
- **Difficulty**: Easy, Medium, or Hard

### Step 2: Tags
Tags help students find and categorize puzzles:

- **Suggested Tags**: Click on pre-defined tags relevant to your chosen category
- **Custom Tags**: Add your own tags using the custom input field
- **Selected Tags**: Review and remove tags as needed

### Step 3: Proof Blocks
Build your proof step by step:

1. **Add Blocks**: Write each proof step in LaTeX format
   - Use the preview to see how your LaTeX will render
   - Press `Ctrl+Enter` to quickly add a block
2. **Reorder Blocks**: Drag blocks to arrange them in the correct logical order
3. **Remove Blocks**: Click the trash icon to delete unwanted blocks

### Step 4: Preview & Publish
- Use the **Preview** toggle to see how students will see your puzzle
- Review all information for accuracy
- Click **Publish Puzzle** to save

## LaTeX Tips

### Common Mathematical Notation
```latex
\text{Regular text}
\frac{numerator}{denominator}
\sum_{i=1}^{n}
\log n
\Theta(n^2)
\le, \ge, =, \neq
\cap, \cup (for sets)
\in, \notin, \subseteq
```

### Text Placeholders (for interactive elements)
```latex
{{complexity}}  // Will become dropdown for O, Ω, Θ
{{op}}          // Will become dropdown for ≤, ≥, =, etc.
{{quantifier}}  // Will become dropdown for ∀, ∃
{{logic}}       // Will become dropdown for ∧, ∨
{{setop}}       // Will become dropdown for ∈, ⊆, etc.
```

## File Management

### After Publishing
1. **Automatic Download**: The system automatically downloads an updated JSON file
2. **Manual Integration**: Replace the corresponding file in your project:
   - Big O puzzles → `src/puzzles/data/big-o-proofs.json`
   - Induction puzzles → `src/puzzles/data/induction-proofs.json`
   - Recursion puzzles → `src/puzzles/data/recursion-proofs.json`
   - Set Theory puzzles → `src/puzzles/data/set-theory-proofs.json`

### Export All Puzzles
Use the **Export All Puzzles** button to download all your created puzzles in a single file for backup.

## Best Practices

### Writing Effective Proofs
1. **Logical Flow**: Ensure each step follows logically from the previous
2. **Appropriate Granularity**: Break complex steps into smaller, manageable pieces
3. **Clear Language**: Use precise mathematical language
4. **Student-Friendly**: Consider the target difficulty level

### Tagging Strategy
- Use specific tags (e.g., "asymptotic-analysis" rather than just "analysis")
- Include difficulty indicators in tags when appropriate
- Consider how students might search for content

### Testing Your Puzzles
1. Use the preview mode to check formatting
2. Verify that all LaTeX renders correctly
3. Ensure the logical order makes sense
4. Consider asking colleagues to review complex proofs

## Troubleshooting

### Common LaTeX Issues
- **Missing braces**: Ensure all `{` have matching `}`
- **Escaped characters**: Use `\\` for actual backslashes in text
- **Text in math mode**: Use `\text{...}` for regular text within math

### Block Ordering
- If drag-and-drop isn't working, try refreshing the page
- Ensure you're dragging from the handle (⋮⋮) icon
- The final order should represent the correct solution sequence

### File Integration
- Make sure to backup original files before replacing
- Verify JSON syntax is valid after editing
- Test the updated puzzles in student mode

## Support

For technical issues or feature requests, please refer to the development documentation or contact the system administrator.
