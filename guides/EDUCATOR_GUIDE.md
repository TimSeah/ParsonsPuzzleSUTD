# Educator Guide: Creating Mathematical Proof Puzzles

This guide explains how educators can use the puzzle creation system to create interactive mathematical proof puzzles for students.

## Getting Started

1. Navigate to the **Educator** section from the navigation menu
2. Click a category under **Quick create**, or use **Create puzzle** at the top of the dashboard, to start
3. The dashboard also shows your puzzle counts (total, by category and by difficulty) and whether the server is **Online**

## Creating a Puzzle

### Step 1: Basic Information
Fill out the essential puzzle details:

- **Category**: Choose from Big O Notation, Mathematical Induction, Recursion, or Set Theory
- **LaTeX Title**: Mathematical title using LaTeX syntax (e.g., `\text{Prove } n^2 + n^3 = \Theta(n^3)`)
- **Display Title**: Plain text version for accessibility (e.g., "Prove n² + n³ = Θ(n³)")
- **Statement**: The mathematical statement to prove (LaTeX format)
- **Difficulty**: Easy, Medium, or Hard

### Step 2: Tags
Add at least one tag. Tags help students find and categorize puzzles:

- **Suggested Tags**: Click on pre-defined tags relevant to your chosen category
- **Custom Tags**: Add your own tags using the custom input field
- **Selected Tags**: Review and remove tags as needed

### Step 3: Proof Blocks
Add at least two proof blocks. Build your proof step by step:

1. **Add Blocks**: Write each proof step in LaTeX format
   - A live preview appears under the box as you type
   - Press `Ctrl+Enter` (or click **Add step**) to add it
2. **Reorder Blocks**: Drag a step by its grip (⋮⋮), or use the ↑ / ↓ buttons, to arrange the steps in the correct logical order
3. **Remove Blocks**: Click the trash icon to delete unwanted blocks

If something is missing when you publish, the message appears under the field that needs fixing.

### Step 4: Preview & Publish
- Switch to **Preview** to see the puzzle exactly as students will, and try solving it
- Review all information for accuracy
- Click **Publish puzzle** to save

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

## Publishing and backups

### Normal publishing

Publishing sends the puzzle to the backend for storage in MongoDB and keeps a backup in this browser's local storage. You do not need to download or replace project files after a successful server save. Students using database content can load the published puzzle; refresh Student mode if it was already open.

The success dialog confirms that students can solve the puzzle now.

### When the server cannot be reached

For certain network failures, the app saves the puzzle in this browser and downloads a category JSON file; the dialog then says the server was unavailable and that students can't see the puzzle yet. This is a local backup, not confirmation that the puzzle reached the shared database. Other server or validation errors can fail publishing without this fallback; the error is shown above the **Publish puzzle** button and your form is kept.

Keep the downloaded file and ask the project maintainer to check or import it before relying on student access. Do not blindly replace a bundled category file: the download may contain only browser-stored puzzles and could omit existing bundled content. Browser-local saves do not automatically synchronize when the server returns.

### Export puzzles

Use **Export all** to download `all-puzzles-export.json`. With the server available, this exports the records returned by the server (currently requested with a limit of 1,000). If fetching fails, it exports puzzles stored in this browser instead. It is not a complete database backup and does not automatically include all bundled local puzzles.

Confirm that the download exists and inspect its `totalPuzzles` count. Keep a copy outside the browser before clearing browser data.

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
- **Backslashes**: Enter LaTeX commands with one backslash in the editor, such as `\frac{1}{2}`. Use doubled backslashes only when writing JSON strings directly.
- **Text in math mode**: Use `\text{...}` for regular text within math

### Block Ordering
- If dragging isn't working, use the ↑ / ↓ buttons instead, or refresh the page
- Ensure you're dragging from the grip (⋮⋮) icon; on touch screens, press and hold it briefly
- The final order should represent the correct solution sequence

### Publishing issues

- If publishing fails, keep a copy of your puzzle text and check that the backend and database are available.
- If a JSON fallback downloads, preserve it and confirm server publication separately before sharing the puzzle with students.
- If a published puzzle is missing, refresh Student mode and check whether it is using local bundled content instead of database content.

## Support

For setup and service checks, see the [Development guide](DEVELOPMENT.md). Database setup and importing bundled puzzles are covered in [Database setup](MIGRATION_GUIDE.md).
