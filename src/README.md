# Parson's Puzzles for Mathematical Proofs

A React-based interactive learning tool that helps students practice formal mathematical proofs through drag-and-drop puzzles.

## Project Overview

This application implements Parson's Puzzles - a pedagogical technique where students arrange scrambled code/proof blocks in the correct order. The tool focuses on mathematical proofs across different domains:

- **Big O Notation**: Asymptotic complexity proofs
- **Mathematical Induction**: Step-by-step inductive proofs
- **Set Theory**: Set operations and relations
- **Recursion**: Recurrence relations and recursive algorithms

## Architecture

### Directory Structure

```
src/
├── components/          # React UI components
│   ├── KatexRenderer.jsx      # LaTeX math rendering
│   ├── ProofBlock.jsx         # Individual draggable proof blocks
│   ├── ProofValidationDisplay.jsx  # Validation feedback UI
│   ├── PuzzleDisplay.jsx      # Main puzzle interface
│   └── ValidatorDemo.jsx      # Development/testing component
├── puzzles/            # Puzzle definitions and data
│   ├── bigOProofs.js         # Big O notation proofs
│   ├── inductionProofs.js    # Mathematical induction proofs
│   ├── recursionProofs.js    # Recursion and recurrence relations
│   ├── setTheoryProofs.js    # Set theory proofs
│   └── index.js              # Puzzle exports and collections
├── utils/              # Business logic and utilities
│   └── ProofValidator.js     # Validation engine
├── App.jsx             # Main application component
└── main.jsx           # Application entry point
```

### Component Hierarchy

```
App
└── PuzzleDisplay
    ├── ProofBlock (multiple instances)
    └── ProofValidationDisplay
        └── KatexRenderer (multiple instances)
```

### Data Flow

1. **Puzzle Selection**: User selects a puzzle from dropdown in `App.jsx`
2. **Block Rendering**: `PuzzleDisplay.jsx` renders shuffled proof blocks
3. **Drag & Drop**: User arranges blocks using `@dnd-kit` library
4. **Validation**: `ProofValidator.js` checks correctness and provides feedback
5. **Feedback**: `ProofValidationDisplay.jsx` shows results and hints

## Key Features

### Drag & Drop Interface
- Powered by `@dnd-kit` for smooth interactions
- Two zones: "Available Steps" (palette) and "Your Proof" (workspace)
- Visual feedback during drag operations

### Real-time Validation
- Immediate feedback on proof correctness
- Progressive hints system
- Detailed error analysis

### LaTeX Support
- Mathematical notation rendered via KaTeX
- Proper formatting for complex mathematical expressions

### Educational Features
- Hints system for guided learning
- Progress tracking
- Multiple puzzle categories
- Solution reveal functionality

## Technical Details

### Dependencies
- **React 18**: UI framework
- **@dnd-kit**: Drag and drop functionality
- **KaTeX**: Mathematical notation rendering
- **Vite**: Build tool and development server

### Validation System
The `ProofValidator` class provides:
- Sequence correctness checking
- Partial validation for progressive feedback
- Hint generation based on common mistakes
- Detailed analytics on user performance

### Puzzle Format
Each puzzle follows a consistent structure:
```javascript
{
  id: 'unique-identifier',
  title: 'LaTeX formatted title',
  displayTitle: 'Plain text for dropdowns',
  statement: 'Mathematical statement to prove',
  blocks: [
    { id: 'block-id', latex: 'LaTeX proof step' }
  ],
  solutionOrder: ['block-id-1', 'block-id-2', ...]
}
```

## Development Guidelines

### Adding New Puzzles
1. Create puzzle object in appropriate category file
2. Add unique block IDs and LaTeX content
3. Define correct solution order
4. Export from category file
5. Add to `ALL_PUZZLES` array in `index.js`

### Component Guidelines
- Use functional components with hooks
- Keep components focused on single responsibilities
- Extract reusable logic into custom hooks
- Document prop interfaces with JSDoc

### Styling Guidelines
- Use CSS modules for component-specific styles
- Follow BEM naming convention
- Maintain consistent spacing and colors
- Ensure responsive design

## Performance Considerations

- Puzzle blocks are memoized to prevent unnecessary re-renders
- Validation runs only when proof arrangement changes
- LaTeX rendering is optimized with proper caching
- Large puzzle sets are code-split by category

## Testing Strategy

- Unit tests for validation logic
- Component tests for UI interactions
- Integration tests for drag & drop workflows
- Manual testing across different puzzle types

## Deployment

The application is built with Vite and can be deployed to any static hosting service:

```bash
npm run build
npm run preview  # Local preview of build
```

## Future Enhancements

- User progress persistence
- Difficulty progression system
- Custom puzzle creation interface
- Collaborative solving features
- Performance analytics dashboard
