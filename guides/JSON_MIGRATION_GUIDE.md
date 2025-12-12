# Migration Guide: JavaScript to JSON Puzzle System

## Overview

This guide explains how to migrate from the JavaScript-based puzzle system to the new JSON-based system.

## What Changed

### Before (JavaScript Files)
- Puzzles were stored in separate `.js` files (`bigOProofs.js`, `inductionProofs.js`, etc.)
- Mixed data and code in the same files
- Direct imports required for each puzzle

### After (JSON Files)
- Puzzles are stored in structured `.json` files in `src/data/puzzles/`
- Pure data storage with no code
- Centralized loading through `PuzzleLoader` service
- Enhanced metadata (difficulty, tags, descriptions)

## File Structure

### New Structure
```
src/
├── data/
│   └── puzzles/
│       ├── big-o-proofs.json
│       ├── induction-proofs.json
│       ├── set-theory-proofs.json
│       └── recursion-proofs.json
├── services/
│   └── puzzleLoader.js
└── puzzles/
    └── index.js (updated to use PuzzleLoader)
```

## JSON Schema

Each JSON file follows this structure:

```json
{
  "category": "Category Name",
  "description": "Description of the category",
  "puzzles": [
    {
      "id": "unique-puzzle-id",
      "title": "LaTeX title for display",
      "displayTitle": "Human-readable title",
      "statement": "LaTeX statement",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2", "tag3"],
      "blocks": [
        {
          "id": "block-id",
          "latex": "LaTeX content"
        }
      ],
      "solutionOrder": ["block1", "block2", "block3"]
    }
  ]
}
```

## Migration Steps

### 1. Backward Compatibility

The migration maintains full backward compatibility. Existing imports still work:

```javascript
// This still works
import { N_SQUARED_PLUS_N_CUBED_THETA_N_CUBED } from './puzzles';
```

### 2. Using the New PuzzleLoader Service

```javascript
import { PuzzleLoader } from './services/puzzleLoader';

// Get all puzzles
const allPuzzles = PuzzleLoader.getAllPuzzles();

// Get puzzles by category
const bigOPuzzles = PuzzleLoader.getPuzzlesByCategory('Big O Notation');

// Get specific puzzle
const puzzle = PuzzleLoader.getPuzzleById('proof1');

// Filter by difficulty
const easyPuzzles = PuzzleLoader.getPuzzlesByDifficulty('easy');

// Search puzzles
const searchResults = PuzzleLoader.searchPuzzles('fibonacci');

// Get random puzzle
const randomPuzzle = PuzzleLoader.getRandomPuzzle();
```

### 3. Component Updates

Update components to use the new service:

```javascript
// Old way
import { ALL_PUZZLES } from './puzzles';

// New way
import { PuzzleLoader } from './services/puzzleLoader';
const puzzles = PuzzleLoader.getAllPuzzles();
```

### 4. Enhanced Features

The new system provides additional features:

```javascript
// Get categories with metadata
const categories = PuzzleLoader.getCategories();
// Returns: { "Big O Notation": { name: "...", description: "...", puzzleCount: 3 } }

// Filter by tags
const inductionPuzzles = PuzzleLoader.getPuzzlesByTags(['induction']);

// Random puzzle from specific category
const randomBigO = PuzzleLoader.getRandomPuzzleFromCategory('Big O Notation');
```

## Benefits of the New System

### 1. **Separation of Concerns**
- Data is separate from code
- Easier to maintain and modify
- Can be edited by non-developers

### 2. **Enhanced Metadata**
- Difficulty levels
- Tagging system
- Category descriptions
- Better organization

### 3. **Better Developer Experience**
- Powerful search and filtering
- Dynamic loading capabilities
- Consistent data structure
- Better tooling support

### 4. **Future-Proof**
- Can be moved to external APIs
- Database integration ready
- Language agnostic
- Better caching support

### 5. **Content Management**
- Version control friendly
- Easy to add new puzzles
- Bulk operations possible
- Validation can be added

## Adding New Puzzles

### Old Way (JavaScript)
```javascript
export const NEW_PUZZLE = {
  id: 'new-puzzle',
  title: 'Title',
  // ... rest of puzzle
};
```

### New Way (JSON)
Add to appropriate JSON file:
```json
{
  "id": "new-puzzle",
  "title": "Title",
  "displayTitle": "Human Title",
  "difficulty": "medium",
  "tags": ["tag1", "tag2"],
  "blocks": [...],
  "solutionOrder": [...]
}
```

## Performance Considerations

### JSON Loading
- JSON files are loaded once at startup
- All puzzles are available immediately
- No additional network requests needed
- Smaller bundle size than individual JS modules

### Future Optimizations
- Lazy loading of puzzle categories
- Dynamic imports for large puzzle sets
- External API integration
- Caching strategies

## Validation

Consider adding JSON schema validation:

```javascript
// Example validation (can be added later)
import Ajv from 'ajv';

const puzzleSchema = {
  type: 'object',
  required: ['id', 'title', 'blocks', 'solutionOrder'],
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    difficulty: { enum: ['easy', 'medium', 'hard'] },
    tags: { type: 'array', items: { type: 'string' } },
    // ... rest of schema
  }
};
```

## Next Steps

1. **Test the migration**: Ensure all existing functionality works
2. **Update components**: Gradually migrate to use PuzzleLoader methods
3. **Add new features**: Utilize the enhanced filtering and search capabilities
4. **Content expansion**: Add more puzzles using the JSON format
5. **Validation**: Consider adding schema validation for puzzle data

## Rollback Plan

If issues arise, you can temporarily revert by:
1. Keeping the old `.js` files alongside the new system
2. Switching the imports back in `puzzles/index.js`
3. The JSON files can remain as a future migration path

This migration provides a solid foundation for scaling the puzzle system while maintaining all existing functionality.
