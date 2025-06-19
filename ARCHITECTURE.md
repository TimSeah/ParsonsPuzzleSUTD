# Project Structure Documentation

This document provides a comprehensive overview of the Parson's Puzzle SUTD project structure and organization.

## Directory Structure

```
ParsonsPuzzleSUTD/
├── public/                     # Static assets
│   └── vite.svg               # Vite logo
├── src/                       # Source code
│   ├── components/            # React components
│   │   ├── KatexRenderer.jsx  # Mathematical notation rendering
│   │   ├── ProofBlock.jsx     # Draggable proof step blocks
│   │   ├── ProofBlock.css     # Block styling
│   │   ├── PuzzleDisplay.jsx  # Main puzzle interface
│   │   ├── PuzzleDisplay.css  # Puzzle layout styling
│   │   ├── ProofValidationDisplay.jsx  # Validation feedback
│   │   ├── ProofValidationDisplay.css  # Validation styling
│   │   └── ValidatorDemo.jsx  # Demo component (legacy)
│   ├── puzzles/               # Puzzle definitions
│   │   ├── index.js          # Puzzle registry and utilities
│   │   ├── bigOProofs.js     # Big O notation proofs
│   │   ├── inductionProofs.js # Mathematical induction proofs
│   │   ├── setTheoryProofs.js # Set theory proofs
│   │   └── recursionProofs.js # Recursion and recurrence proofs
│   ├── utils/                 # Utility modules
│   │   ├── ProofValidator.js  # Core validation logic
│   │   └── README.md         # Utilities documentation
│   ├── types/                 # Type definitions
│   │   └── index.js          # JSDoc type definitions
│   ├── styles/               # Style documentation
│   │   └── README.md         # CSS and design system docs
│   ├── App.jsx               # Root application component
│   ├── App.css               # Global application styles
│   ├── main.jsx              # Application entry point
│   ├── index.css             # Base styles and reset
│   └── assets/               # Application assets
│       └── react.svg         # React logo
├── README.md                  # Project documentation
├── package.json              # NPM dependencies and scripts
├── vite.config.js            # Vite build configuration
└── eslint.config.js          # ESLint configuration
```

## Component Architecture

### App.jsx
- **Purpose**: Root application component and state management
- **Responsibilities**: 
  - Puzzle selection and navigation
  - Global state management
  - Routing between puzzles
- **Key Features**: Dropdown puzzle selector, navigation controls

### PuzzleDisplay.jsx
- **Purpose**: Main interactive puzzle interface
- **Responsibilities**:
  - Drag and drop functionality
  - Block management (available vs. workspace)
  - Reset and solution display
- **Dependencies**: @dnd-kit for drag and drop, KatexRenderer for math

### ProofValidationDisplay.jsx
- **Purpose**: Real-time validation and feedback
- **Responsibilities**:
  - Proof validation using ProofValidator
  - Score display and feedback
  - Hint system management
  - Navigation controls
- **Key Features**: Adaptive scoring, contextual hints, success actions

### ProofBlock.jsx
- **Purpose**: Individual draggable proof step
- **Responsibilities**:
  - Drag and drop behavior
  - Mathematical content rendering
  - Visual feedback during interactions
- **Dependencies**: @dnd-kit/sortable, KatexRenderer

### KatexRenderer.jsx
- **Purpose**: Mathematical notation rendering
- **Responsibilities**:
  - Safe LaTeX rendering with KaTeX
  - Error handling and fallback
  - Accessibility support
- **Dependencies**: katex library

## Data Architecture

### Puzzle Structure
Each puzzle follows a standardized format:

```javascript
{
  id: string,           // Unique identifier
  title: string,        // LaTeX title for display
  displayTitle: string, // Plain text for dropdown
  statement: string,    // Mathematical statement to prove
  blocks: Array<{       // Proof step blocks
    id: string,
    latex: string
  }>,
  solutionOrder: Array<string>  // Correct order of block IDs
}
```

### Validation System
The ProofValidator provides:
- Real-time correctness checking
- Detailed scoring (0-100%)
- Contextual hint generation
- Progress tracking and analytics

## Build and Development

### Technology Stack
- **Frontend**: React 18 with Vite
- **Styling**: CSS Modules with modern CSS features
- **Math Rendering**: KaTeX for LaTeX support
- **Drag & Drop**: @dnd-kit library
- **Linting**: ESLint with modern JavaScript rules

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Development Workflow
1. Component development with hot module replacement
2. Real-time linting and error checking
3. Mathematical notation testing with KaTeX
4. Drag and drop interaction testing

## Key Features

### Educational Design
- **Progressive Difficulty**: Puzzles ordered from basic to advanced
- **Immediate Feedback**: Real-time validation with helpful hints
- **Visual Learning**: Drag and drop interface for kinesthetic learning
- **Mathematical Rigor**: Proper mathematical notation and proof structure

### Technical Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance**: Optimized rendering and smooth animations
- **Maintainability**: Modular architecture with clear separation of concerns

## Extension Points

The project is designed for easy extension:

### Adding New Puzzles
1. Create puzzle definitions in appropriate module
2. Export puzzle constants
3. Add to ALL_PUZZLES array in puzzles/index.js
4. Puzzle automatically appears in dropdown

### Custom Validation
1. Extend ProofValidator class
2. Override validation methods
3. Add custom hint generation logic

### UI Enhancements
1. Modify component CSS files
2. Follow established design system
3. Maintain responsive design principles

### New Proof Types
1. Create new puzzle module (e.g., geometryProofs.js)
2. Follow established puzzle structure
3. Add appropriate documentation

## Best Practices

### Code Organization
- Components in `/components` with co-located styles
- Business logic in `/utils`
- Data definitions in `/puzzles`
- Type definitions in `/types`

### Naming Conventions
- PascalCase for components
- camelCase for functions and variables
- SCREAMING_SNAKE_CASE for constants
- kebab-case for CSS classes

### Documentation
- JSDoc comments for all functions
- README files for complex modules
- Inline comments for complex logic
- Type definitions for maintainability
