# Utilities Documentation

This directory contains utility modules that provide core functionality for the Parson's Puzzle application.

## ProofValidator.js

The `ProofValidator` class is the core utility for validating student proof attempts in the puzzle system.

### Features

- **Real-time validation**: Checks proof correctness as students arrange blocks
- **Detailed scoring**: Provides percentage scores based on correctness and completion
- **Contextual hints**: Generates helpful hints based on current student progress
- **Error handling**: Robust error handling for invalid inputs and edge cases
- **Debug support**: Built-in debugging methods for development and testing

### Usage

```javascript
import ProofValidator from './ProofValidator';

// Create validator for a puzzle
const validator = new ProofValidator(puzzle);

// Validate a student's proof attempt
const result = validator.validateProof(['block1', 'block2', 'block3']);

// Access validation results
console.log(result.isCorrect); // boolean
console.log(result.score);     // 0-100
console.log(result.feedback);  // string
console.log(result.hints);     // array of hint objects
```

### Validation Result Structure

```javascript
{
  isCorrect: boolean,           // Whether the proof is completely correct
  score: number,                // Percentage score (0-100)
  feedback: string,             // Human-readable feedback message
  hints: Array<{               // Array of contextual hints
    type: string,              // 'position', 'missing', 'next'
    message: string,           // Hint message
    latex?: string             // Optional LaTeX content
  }>,
  details: {                   // Detailed analysis
    userBlocks: number,        // Number of blocks in user solution
    totalBlocks: number,       // Total blocks needed
    correctlyPositioned: Array, // IDs of correctly positioned blocks
    incorrectlyPositioned: Array, // IDs of incorrectly positioned blocks
    missingBlocks: Array,      // IDs of missing blocks
    extraBlocks: Array         // IDs of extra/unused blocks
  }
}
```

### Scoring Algorithm

The scoring system considers multiple factors:

1. **Completion**: How many of the required blocks are present
2. **Accuracy**: How many blocks are in the correct positions
3. **Order**: Whether the logical flow of the proof is maintained

Score calculation:
- Base score from correct positions
- Completion bonus for having all required blocks
- Penalties for incorrect positions and missing blocks

### Hint Generation

The validator generates contextual hints based on:

- **Position hints**: When blocks are in wrong positions
- **Missing hints**: When required blocks are missing
- **Next step hints**: When students need guidance on the next logical step

### Error Handling

The validator includes comprehensive error handling for:

- Invalid puzzle objects
- Malformed block arrays
- Missing required properties
- Edge cases in validation logic

### Development and Debugging

Debug methods available:

```javascript
validator.debugValidation(['block1', 'block2']); // Detailed console output
validator.debugHints(['block1', 'block2']);      // Hint generation details
```

## Future Enhancements

Potential improvements to the validation system:

- **Partial credit**: More nuanced scoring for partially correct arrangements
- **Learning analytics**: Track student progress over time
- **Adaptive hints**: Adjust hint difficulty based on student performance
- **Custom validation**: Allow puzzle creators to define custom validation rules
