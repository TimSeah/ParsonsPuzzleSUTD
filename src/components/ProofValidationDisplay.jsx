/**
 * @fileoverview ProofValidationDisplay component - Real-time validation and feedback for proof puzzles
 * 
 * This component provides validation feedback, scoring, hints, and navigation f            {isLastPuzzle ? '🔄 Start Over' : '🎉 Try Next Puzzle'}r proof puzzles.
 * It integrates with the ProofValidator utility to assess user progress and provide meaningful
 * feedback to guide learning.
 * 
 * Features:
 * - Real-time proof validation with scoring
 * - Contextual hints and feedback
 * - Progress tracking and statistics
 * - Navigation controls for puzzle progression
 * - Visual feedback with color-coded scoring
 * 
 * @author Parson's Puzzle SUTD Team
 */

import React, { useState, useEffect } from 'react';
import ProofValidator from '../utils/ProofValidator';
import KatexRenderer from './KatexRenderer';
import './ProofValidationDisplay.css';

/**
 * Displays validation results, hints, and navigation for proof puzzles
 * 
 * @param {Object} props - Component properties
 * @param {import('../types/index.js').Puzzle} props.puzzle - Current puzzle object
 * @param {Array} props.proofBlocks - Array of blocks in the current proof attempt
 * @param {Function} props.onReset - Callback to reset the current puzzle
 * @param {Function} props.onNextPuzzle - Callback to navigate to the next puzzle
 * @param {boolean} props.isLastPuzzle - Whether this is the last puzzle in the sequence
 * @returns {JSX.Element} Rendered validation display
 */
const ProofValidationDisplay = ({ puzzle, proofBlocks, onReset, onNextPuzzle, isLastPuzzle }) => {
  // State for validation system
  const [validator, setValidator] = useState(() => new ProofValidator(puzzle));
  const [validationResult, setValidationResult] = useState(null);
  const [showHints, setShowHints] = useState(false);

  /**
   * Update validator when puzzle changes to ensure accurate validation
   */
  useEffect(() => {
    setValidator(prevValidator => {
      // Only create new validator if puzzle actually changed
      if (prevValidator.puzzle.id !== puzzle.id) {
        return new ProofValidator(puzzle);
      }
      return prevValidator;
    });
  }, [puzzle]);

  /**
   * Validate proof whenever blocks change
   */
  useEffect(() => {
    if (proofBlocks && proofBlocks.length > 0) {
      const userOrder = proofBlocks.map(block => block.id);
      const result = validator.validateProof(userOrder);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [proofBlocks, validator]);

  /**
   * Returns color based on score for visual feedback
   * @param {number} score - Score percentage (0-100)
   * @returns {string} CSS color value
   */
  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 70) return '#FFC107'; // Amber
    if (score >= 50) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  /**
   * Returns emoji based on score for visual feedback
   * @param {number} score - Score percentage (0-100)
   * @returns {string} Appropriate emoji
   */
  const getScoreEmoji = (score) => {
    if (score >= 90) return '🌟';
    if (score >= 70) return '👍';
    if (score >= 50) return '👌';
    return '💪';
  };

  // Show prompt when no validation result is available
  if (!validationResult) {
    return (
      <div className="validation-display empty">
        <p className="validation-prompt">
          🧩 Arrange the proof blocks to validate your solution
        </p>
      </div>
    );
  }

  return (
    <div className={`validation-display ${validationResult.isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="validation-header">
        <div className="score-section">
          <span className="score-emoji">{getScoreEmoji(validationResult.score)}</span>
          <span 
            className="score-value" 
            style={{ color: getScoreColor(validationResult.score) }}
          >
            {validationResult.score}%
          </span>
        </div>
        
        <div className="status-section">
          {validationResult.isCorrect ? (
            <span className="status correct">✅ Correct!</span>
          ) : (
            <span className="status incorrect">❌ Keep trying</span>
          )}
        </div>
      </div>

      <div className="validation-feedback">
        <p className="feedback-text">{validationResult.feedback}</p>
      </div>

      {validationResult.details && (
        <div className="validation-details">
          <div className="detail-stats">
            <div className="stat">
              <span className="stat-label">Progress:</span>
              <span className="stat-value">
                {validationResult.details.userBlocks} / {validationResult.details.totalBlocks}
              </span>
            </div>
            
            {validationResult.details.correctlyPositioned.length > 0 && (
              <div className="stat">
                <span className="stat-label">Correct positions:</span>
                <span className="stat-value correct">
                  {validationResult.details.correctlyPositioned.length}
                </span>
              </div>
            )}
            
            {validationResult.details.incorrectlyPositioned.length > 0 && (
              <div className="stat">
                <span className="stat-label">Wrong positions:</span>
                <span className="stat-value incorrect">
                  {validationResult.details.incorrectlyPositioned.length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {validationResult.hints && validationResult.hints.length > 0 && (
        <div className="hints-section">
          <button 
            className="hints-toggle"
            onClick={() => setShowHints(!showHints)}
          >
            💡 {showHints ? 'Hide' : 'Show'} Hints ({validationResult.hints.length})
          </button>
          
          {showHints && (
            <div className="hints-list">
              {validationResult.hints.map((hint, index) => (
                <div key={index} className={`hint hint-${hint.type}`}>
                  <div className="hint-header">
                    <span className="hint-icon">
                      {hint.type === 'position' && '📍'}
                      {hint.type === 'missing' && '❓'}
                      {hint.type === 'next' && '➡️'}
                    </span>
                    <span className="hint-message">{hint.message}</span>
                  </div>
                  {hint.latex && (
                    <div className="hint-latex">
                      <KatexRenderer latex={hint.latex} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}        </div>
      )}

      {/* Success Actions (shown when puzzle is completed correctly) */}
      {validationResult.isCorrect && (
        <div className="success-actions">
          <button 
            className="action-button primary" 
            onClick={onNextPuzzle}
            disabled={!onNextPuzzle}
          >
            {isLastPuzzle ? '� Start Over' : '�🎉 Try Next Puzzle'}
          </button>
          <button 
            className="action-button secondary" 
            onClick={onReset}
            disabled={!onReset}
          >
            🔄 Reset & Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ProofValidationDisplay;