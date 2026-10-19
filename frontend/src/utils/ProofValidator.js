/**
 * ProofValidator - Validates proof sequences for Parsons puzzles
 * 
 * This utility provides functionality to validate whether a user's arrangement
 * of proof blocks matches the correct solution order, with support for
 * partial validation, hint generation, and detailed feedback.
 */

export class ProofValidator {
  constructor(puzzle) {
    this.puzzle = puzzle;
    this.solutionOrder = puzzle.solutionOrder;
    this.blockMap = new Map(puzzle.blocks.map(block => [block.id, block]));
  }
  /**
   * Validates the complete proof sequence
   * @param {Array} userOrder - Array of block IDs in user's order
   * @returns {Object} Validation result with score, feedback, and details
   */
  validateProof(userOrder) {
    if (!userOrder || userOrder.length === 0) {
      return {
        isCorrect: false,
        score: 0,
        feedback: "Please arrange the proof blocks to create a valid proof.",
        details: {
          totalBlocks: this.solutionOrder.length,
          correctBlocks: 0,
          incorrectBlocks: 0,
          missingBlocks: this.solutionOrder.length,
          extraBlocks: 0
        }
      };
    }

    // Check for puzzle mismatch
    const blockValidation = this.validateBlockIds(userOrder);
    if (!blockValidation.isValid) {
      console.warn('ProofValidator: Block ID mismatch detected', {
        puzzleId: this.puzzle.id,
        puzzleTitle: this.puzzle.title,
        invalidBlocks: blockValidation.invalidBlocks,
        userOrder
      });
      
      return {
        isCorrect: false,
        score: 0,
        feedback: `Error: Some blocks don't belong to the current puzzle "${this.puzzle.title}". Please refresh the page.`,
        details: {
          totalBlocks: this.solutionOrder.length,
          correctBlocks: 0,
          incorrectBlocks: userOrder.length,
          missingBlocks: this.solutionOrder.length,
          extraBlocks: userOrder.length,
          puzzleMismatch: true,
          invalidBlocks: blockValidation.invalidBlocks
        },
        hints: []
      };
    }

    const result = this._analyzeSequence(userOrder);
    const feedback = this._generateFeedback(result);

    return {
      isCorrect: result.isComplete && result.correctSequence,
      score: this._calculateScore(result),
      feedback,
      details: result,
      hints: this._generateHints(result, userOrder)
    };
  }

  /**
   * Validates a partial proof (useful for real-time feedback)
   * @param {Array} userOrder - Array of block IDs in user's current order
   * @returns {Object} Partial validation result
   */
  validatePartial(userOrder) {
    if (!userOrder || userOrder.length === 0) {
      return {
        isValid: true,
        correctSoFar: true,
        nextExpected: this.solutionOrder[0],
        progress: 0
      };
    }

    const correctSoFar = this._isCorrectSequence(userOrder, 0, userOrder.length);
    const nextExpectedIndex = userOrder.length;
    const nextExpected = nextExpectedIndex < this.solutionOrder.length 
      ? this.solutionOrder[nextExpectedIndex] 
      : null;

    return {
      isValid: correctSoFar,
      correctSoFar,
      nextExpected,
      progress: (userOrder.length / this.solutionOrder.length) * 100,
      currentLength: userOrder.length,
      totalLength: this.solutionOrder.length
    };
  }

  /**
   * Checks if a block can be placed at a specific position
   * @param {string} blockId - ID of the block to place
   * @param {number} position - Target position (0-indexed)
   * @param {Array} currentOrder - Current user arrangement
   * @returns {boolean} Whether the placement is valid
   */
  canPlaceBlock(blockId, position, currentOrder = []) {
    if (position < 0 || position >= this.solutionOrder.length) {
      return false;
    }

    // Check if this is the correct block for this position
    if (this.solutionOrder[position] !== blockId) {
      return false;
    }

    // Check if previous positions are correctly filled
    for (let i = 0; i < position; i++) {
      if (i >= currentOrder.length || currentOrder[i] !== this.solutionOrder[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets the next valid block that should be placed
   * @param {Array} currentOrder - Current user arrangement
   * @returns {string|null} ID of the next expected block, or null if complete
   */
  getNextExpectedBlock(currentOrder = []) {
    if (currentOrder.length >= this.solutionOrder.length) {
      return null;
    }

    // Check if current sequence is correct
    if (this._isCorrectSequence(currentOrder, 0, currentOrder.length)) {
      return this.solutionOrder[currentOrder.length];
    }

    // Find first incorrect position
    for (let i = 0; i < currentOrder.length; i++) {
      if (currentOrder[i] !== this.solutionOrder[i]) {
        return this.solutionOrder[i];
      }
    }

    return null;
  }
  /**
   * Analyzes the complete sequence and returns detailed results
   * @private
   */
  _analyzeSequence(userOrder) {
    const solutionSet = new Set(this.solutionOrder);
    const userSet = new Set(userOrder);
    
    // Count blocks that exist in both solution and user's attempt
    const correctBlocksInSolution = [...userSet].filter(id => solutionSet.has(id)).length;
    
    // Count extra blocks (blocks in user's solution but not in correct solution)
    const extraBlocks = [...userSet].filter(id => !solutionSet.has(id)).length;
    
    // Count missing blocks (blocks in correct solution but not in user's attempt)
    const missingBlocks = [...solutionSet].filter(id => !userSet.has(id)).length;
    
    const isComplete = userOrder.length === this.solutionOrder.length && 
                      missingBlocks === 0 && extraBlocks === 0;
    
    const correctSequence = isComplete && 
                           this._isCorrectSequence(userOrder, 0, userOrder.length);

    // Find correctly positioned blocks
    const correctlyPositioned = [];
    const incorrectlyPositioned = [];
    
    for (let i = 0; i < Math.min(userOrder.length, this.solutionOrder.length); i++) {
      if (userOrder[i] === this.solutionOrder[i]) {
        correctlyPositioned.push({
          blockId: userOrder[i],
          position: i
        });
      } else {
        incorrectlyPositioned.push({
          blockId: userOrder[i],
          position: i,
          expectedBlockId: this.solutionOrder[i]
        });
      }
    }

    return {
      totalBlocks: this.solutionOrder.length,
      userBlocks: userOrder.length,
      correctBlocks: correctBlocksInSolution,
      extraBlocks,
      missingBlocks,
      isComplete,
      correctSequence,
      correctlyPositioned,
      incorrectlyPositioned,
      duplicates: this._findDuplicates(userOrder)
    };
  }

  /**
   * Checks if a subsequence is correct
   * @private
   */
  _isCorrectSequence(userOrder, start, end) {
    for (let i = start; i < end; i++) {
      if (i >= this.solutionOrder.length || userOrder[i] !== this.solutionOrder[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Finds duplicate blocks in user order
   * @private
   */
  _findDuplicates(userOrder) {
    const seen = new Set();
    const duplicates = [];
    
    userOrder.forEach((blockId, index) => {
      if (seen.has(blockId)) {
        duplicates.push({ blockId, position: index });
      } else {
        seen.add(blockId);
      }
    });
    
    return duplicates;
  }

  /**
   * Calculates a score based on correctness
   * @private
   */
  _calculateScore(result) {
    if (result.correctSequence) {
      return 100;
    }

    // Partial scoring based on correct positions and presence of correct blocks
    const positionScore = (result.correctlyPositioned.length / result.totalBlocks) * 60;
    const presenceScore = (result.correctBlocks / result.totalBlocks) * 40;
    
    // Penalty for extra blocks
    const extraPenalty = Math.min(result.extraBlocks * 5, 20);
    
    return Math.max(0, Math.round(positionScore + presenceScore - extraPenalty));
  }

  /**
   * Generates human-readable feedback
   * @private
   */
  _generateFeedback(result) {
    if (result.correctSequence) {
      return "🎉 Excellent! Your proof is completely correct!";
    }

    const feedback = [];

    if (result.missingBlocks > 0) {
      feedback.push(`❌ Missing ${result.missingBlocks} block(s) from your proof.`);
    }

    if (result.extraBlocks > 0) {
      feedback.push(`⚠️ You have ${result.extraBlocks} extra or incorrect block(s).`);
    }

    if (result.duplicates.length > 0) {
      feedback.push(`🔄 You have ${result.duplicates.length} duplicate block(s).`);
    }

    if (result.incorrectlyPositioned.length > 0) {
      feedback.push(`📍 ${result.incorrectlyPositioned.length} block(s) are in the wrong position.`);
    }

    if (result.correctlyPositioned.length > 0) {
      feedback.push(`✅ ${result.correctlyPositioned.length} block(s) are correctly positioned.`);
    }

    return feedback.length > 0 ? feedback.join(' ') : "Keep working on your proof!";
  }  /**
   * Generates specific hints for improvement
   * @private
   */
  _generateHints(result, userOrder) {
    const hints = [];
    const usedBlocks = new Set(); // Track blocks already suggested

    if (result.correctSequence) {
      return hints;
    }

    // Safety check: ensure we're working with the right puzzle
    const blockValidation = this.validateBlockIds(userOrder);
    if (!blockValidation.isValid) {
      console.warn('ProofValidator: Cannot generate hints due to puzzle mismatch');
      return [{
        type: 'error',
        message: 'Please refresh the page - there seems to be a puzzle mismatch.',
        latex: '',
        blockId: null
      }];
    }

    // Hint about first incorrect position
    if (result.incorrectlyPositioned.length > 0) {
      const firstError = result.incorrectlyPositioned[0];
      const expectedBlock = this.blockMap.get(firstError.expectedBlockId);
      
      if (expectedBlock && !usedBlocks.has(firstError.expectedBlockId)) {
        hints.push({
          type: 'position',
          message: `The block at position ${firstError.position + 1} should be:`,
          latex: expectedBlock.latex,
          position: firstError.position,
          expectedBlockId: firstError.expectedBlockId
        });
        usedBlocks.add(firstError.expectedBlockId);
      }
    }

    // Hint about missing blocks (find the next missing block in sequence)
    if (result.missingBlocks > 0 && hints.length < 3) {
      // Find the first missing block that should come next in the sequence
      for (let i = 0; i < this.solutionOrder.length && hints.length < 3; i++) {
        const blockId = this.solutionOrder[i];
        if (!userOrder.includes(blockId) && !usedBlocks.has(blockId)) {
          const missingBlock = this.blockMap.get(blockId);
          if (missingBlock) {
            hints.push({
              type: 'missing',
              message: `You're missing this important step:`,
              latex: missingBlock.latex,
              blockId: blockId
            });
            usedBlocks.add(blockId);
            break; // Only suggest one missing block at a time
          }
        }
      }
    }

    // Hint about next expected block (if different from already suggested)
    if (userOrder.length < this.solutionOrder.length && hints.length < 3) {
      const nextExpected = this.getNextExpectedBlock(userOrder);
      if (nextExpected && !usedBlocks.has(nextExpected)) {
        const nextBlock = this.blockMap.get(nextExpected);
        if (nextBlock) {
          hints.push({
            type: 'next',
            message: `Try adding this block next:`,
            latex: nextBlock.latex,
            blockId: nextExpected
          });
          usedBlocks.add(nextExpected);
        }
      }
    }

    // If we still don't have enough hints, suggest additional missing blocks
    if (hints.length < 3 && result.missingBlocks > 0) {
      const missingIds = this.solutionOrder.filter(id => !userOrder.includes(id) && !usedBlocks.has(id));
      for (let i = 0; i < missingIds.length && hints.length < 3; i++) {
        const missingBlock = this.blockMap.get(missingIds[i]);
        if (missingBlock) {
          hints.push({
            type: 'missing',
            message: `Consider this step:`,
            latex: missingBlock.latex,
            blockId: missingIds[i]
          });
          usedBlocks.add(missingIds[i]);
        }
      }
    }

    return hints;
  }

  /**
   * Truncates LaTeX for display (now only used for non-hint purposes)
   * @private
   */
  _truncateLatex(latex, maxLength = 50) {
    if (latex.length <= maxLength) {
      return latex;
    }
    return latex.substring(0, maxLength) + '...';
  }

  /**
   * Gets validation statistics for the puzzle
   * @returns {Object} Statistics about the puzzle structure
   */
  getStatistics() {
    return {
      totalBlocks: this.solutionOrder.length,
      blockTypes: this.puzzle.blocks.map(block => ({
        id: block.id,
        preview: this._truncateLatex(block.latex, 30)
      })),
      difficulty: this._estimateDifficulty()
    };
  }

  /**
   * Estimates puzzle difficulty based on number of blocks
   * @private
   */
  _estimateDifficulty() {
    const blockCount = this.solutionOrder.length;
    if (blockCount <= 5) return 'Easy';
    if (blockCount <= 10) return 'Medium';
    return 'Hard';
  }

  /**
   * Debug method to analyze what's happening with validation
   * @param {Array} userOrder - Array of block IDs in user's order
   * @returns {Object} Debug information
   */
  debugValidation(userOrder) {
    const result = this._analyzeSequence(userOrder);
    const hints = this._generateHints(result, userOrder);
    
    return {
      puzzle: {
        id: this.puzzle.id,
        title: this.puzzle.title,
        totalBlocks: this.solutionOrder.length,
        solutionOrder: this.solutionOrder
      },
      userInput: {
        userOrder,
        userBlocks: userOrder.length
      },
      analysis: result,
      hints,
      validation: this.validateProof(userOrder)
    };
  }

  /**
   * Validates that a user order contains only valid block IDs for this puzzle
   * @param {Array} userOrder - Array of block IDs in user's order
   * @returns {Object} Validation result with invalid blocks identified
   */
  validateBlockIds(userOrder) {
    const validBlockIds = new Set(this.puzzle.blocks.map(block => block.id));
    const invalidBlocks = userOrder.filter(id => !validBlockIds.has(id));
    const validBlocks = userOrder.filter(id => validBlockIds.has(id));
    
    return {
      isValid: invalidBlocks.length === 0,
      invalidBlocks,
      validBlocks,
      puzzleId: this.puzzle.id,
      puzzleTitle: this.puzzle.title
    };
  }
}

// Export utility functions that can be used independently
export const ValidationUtils = {
  /**
   * Quick validation function for simple use cases
   */
  isCorrectOrder: (userOrder, correctOrder) => {
    if (userOrder.length !== correctOrder.length) return false;
    return userOrder.every((block, index) => block === correctOrder[index]);
  },

  /**
   * Calculate percentage similarity between two sequences
   */
  calculateSimilarity: (userOrder, correctOrder) => {
    if (correctOrder.length === 0) return 0;
    
    let matches = 0;
    const minLength = Math.min(userOrder.length, correctOrder.length);
    
    for (let i = 0; i < minLength; i++) {
      if (userOrder[i] === correctOrder[i]) {
        matches++;
      }
    }
    
    return (matches / correctOrder.length) * 100;
  },

  /**
   * Find the longest correct subsequence from the beginning
   */
  findCorrectPrefix: (userOrder, correctOrder) => {
    let length = 0;
    const minLength = Math.min(userOrder.length, correctOrder.length);
    
    for (let i = 0; i < minLength; i++) {
      if (userOrder[i] === correctOrder[i]) {
        length++;
      } else {
        break;
      }
    }
    
    return length;
  }
};

export default ProofValidator;