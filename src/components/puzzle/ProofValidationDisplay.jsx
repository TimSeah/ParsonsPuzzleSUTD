import React, { useState, useEffect } from 'react';
import ProofValidator from '../../utils/ProofValidator';
import { KatexRenderer } from '../renderers';
import './ProofValidationDisplay.css';

const ProofValidationDisplay = ({ puzzle, proofBlocks, onReset, onNextPuzzle, isLastPuzzle }) => {
  const [validator, setValidator] = useState(() => new ProofValidator(puzzle));
  const [validationResult, setValidationResult] = useState(null);
  const [showHints, setShowHints] = useState(false);

  // Update validator when puzzle changes
  useEffect(() => {
    setValidator(prevValidator => {
      // Only create new validator if puzzle actually changed
      if (prevValidator.puzzle.id !== puzzle.id) {
        return new ProofValidator(puzzle);
      }
      return prevValidator;
    });
  }, [puzzle]);

  useEffect(() => {
    if (proofBlocks && proofBlocks.length > 0) {
      const userOrder = proofBlocks.map(block => block.id);
      const result = validator.validateProof(userOrder);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [proofBlocks, validator]);

  const getScoreColor = (score) => {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 70) return '#FFC107'; // Amber
    if (score >= 50) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getScoreEmoji = (score) => {
    if (score >= 90) return '🌟';
    if (score >= 70) return '👍';
    if (score >= 50) return '👌';
    return '💪';
  };

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
          )}
        </div>
      )}      {validationResult.isCorrect && (
        <div className="success-actions">
          <button 
            className="action-button primary" 
            onClick={onNextPuzzle}
            disabled={!onNextPuzzle}
          >
            {isLastPuzzle ? '🔄 Start Over' : '🎉 Try Next Puzzle'}
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