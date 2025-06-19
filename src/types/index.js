/**
 * Type Definitions for Parson's Puzzles Application
 * 
 * This file contains JSDoc type definitions for better code documentation
 * and IDE support. While this is a JavaScript project, these type definitions
 * help maintain consistency and provide better developer experience.
 * 
 * @fileoverview Type definitions for the application
 */

/**
 * @typedef {Object} ProofBlock
 * @description A single block in a mathematical proof
 * @property {string} id - Unique identifier for the block
 * @property {string} latex - LaTeX formatted mathematical content
 */

/**
 * @typedef {Object} Puzzle
 * @description A complete mathematical proof puzzle
 * @property {string} id - Unique puzzle identifier
 * @property {string} title - LaTeX formatted title for display
 * @property {string} displayTitle - Plain text title for dropdowns/navigation
 * @property {string} statement - Mathematical statement to prove
 * @property {ProofBlock[]} blocks - Array of proof blocks to arrange
 * @property {string[]} solutionOrder - Correct order of block IDs
 */

/**
 * @typedef {Object} ValidationResult
 * @description Result of proof validation
 * @property {boolean} isCorrect - Whether the proof is completely correct
 * @property {number} score - Numerical score (0-100)
 * @property {string} feedback - Human-readable feedback message
 * @property {ValidationDetails} details - Detailed validation information
 * @property {Hint[]} [hints] - Optional hints for improvement
 */

/**
 * @typedef {Object} ValidationDetails
 * @description Detailed validation information
 * @property {number} totalBlocks - Total number of blocks in solution
 * @property {number} userBlocks - Number of blocks in user's attempt
 * @property {number} correctBlocks - Number of correct blocks present
 * @property {number} extraBlocks - Number of extra/incorrect blocks
 * @property {number} missingBlocks - Number of missing blocks
 * @property {boolean} isComplete - Whether user has all required blocks
 * @property {boolean} correctSequence - Whether the sequence is correct
 * @property {PositionInfo[]} correctlyPositioned - Correctly positioned blocks
 * @property {PositionInfo[]} incorrectlyPositioned - Incorrectly positioned blocks
 * @property {DuplicateInfo[]} duplicates - Duplicate blocks found
 * @property {boolean} [puzzleMismatch] - Whether blocks belong to wrong puzzle
 * @property {string[]} [invalidBlocks] - Block IDs that don't belong to puzzle
 */

/**
 * @typedef {Object} PositionInfo
 * @description Information about block positioning
 * @property {string} blockId - Block identifier
 * @property {number} position - Position in the sequence (0-indexed)
 * @property {string} [expectedBlockId] - Expected block ID at this position
 */

/**
 * @typedef {Object} DuplicateInfo
 * @description Information about duplicate blocks
 * @property {string} blockId - Duplicated block identifier
 * @property {number} position - Position of the duplicate (0-indexed)
 */

/**
 * @typedef {Object} Hint
 * @description Hint for improving the proof
 * @property {HintType} type - Type of hint
 * @property {string} message - Hint message
 * @property {string} latex - LaTeX content to display
 * @property {string} [blockId] - Associated block ID
 * @property {number} [position] - Associated position
 * @property {string} [expectedBlockId] - Expected block at position
 */

/**
 * @typedef {'position'|'missing'|'next'|'error'} HintType
 * @description Types of hints that can be provided
 */

/**
 * @typedef {Object} DragEndEvent
 * @description Drag and drop event information
 * @property {string} active - ID of the dragged item
 * @property {string|null} over - ID of the drop target
 */

/**
 * @typedef {Object} PuzzleCategory
 * @description Puzzle category information
 * @property {string} name - Category display name
 * @property {string} description - Category description
 * @property {Puzzle[]} puzzles - Puzzles in this category
 * @property {string} color - Theme color for the category
 * @property {string} icon - Icon identifier for the category
 */

/**
 * @typedef {Object} UserProgress
 * @description User's progress through puzzles
 * @property {string} currentPuzzleId - Currently active puzzle
 * @property {Object<string, PuzzleProgress>} puzzleProgress - Progress per puzzle
 * @property {number} totalScore - Cumulative score across all puzzles
 * @property {Date} lastActivity - Last activity timestamp
 */

/**
 * @typedef {Object} PuzzleProgress
 * @description Progress on a specific puzzle
 * @property {boolean} completed - Whether puzzle is completed
 * @property {number} bestScore - Best score achieved
 * @property {number} attempts - Number of attempts made
 * @property {Date} lastAttempt - Last attempt timestamp
 * @property {number} timeSpent - Total time spent in milliseconds
 */

/**
 * @typedef {Object} AppConfig
 * @description Application configuration
 * @property {boolean} showHints - Whether to show hints by default
 * @property {boolean} autoAdvance - Whether to auto-advance to next puzzle
 * @property {string} theme - UI theme ('light'|'dark')
 * @property {number} hintDelay - Delay before showing hints (ms)
 * @property {boolean} soundEnabled - Whether to play sounds
 */

/**
 * @typedef {Object} PuzzleMetadata
 * @description Metadata about puzzle collection
 * @property {number} totalCount - Total number of puzzles
 * @property {string[]} categories - Available categories
 * @property {string[]} difficulties - Available difficulty levels
 * @property {string} version - Collection version
 * @property {string} lastUpdated - Last update timestamp
 */

// Export types for JSDoc (this is a no-op in JavaScript but helps with documentation)
export {};
