import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, CircleHelp, Lightbulb, MapPin, RotateCcw } from 'lucide-react';
import ProofValidator from '../../utils/ProofValidator';
import { KatexRenderer } from '../renderers';
import './ProofValidationDisplay.css';

const HINT_ICONS = { position: MapPin, missing: CircleHelp, next: ArrowRight };

const scoreTone = (score) => {
  if (score >= 90) return 'success';
  if (score >= 50) return 'attention';
  return 'danger';
};

const ProofValidationDisplay = ({ puzzle, proofBlocks, onReset, onNextPuzzle, isLastPuzzle, onPuzzleTried }) => {
  const [validator, setValidator] = useState(() => new ProofValidator(puzzle));
  const [validationResult, setValidationResult] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [completionReported, setCompletionReported] = useState(false);

  // Update validator when puzzle changes
  useEffect(() => {
    setValidator(prevValidator => (prevValidator.puzzle.id !== puzzle.id ? new ProofValidator(puzzle) : prevValidator));
  }, [puzzle]);

  useEffect(() => { setCompletionReported(false); }, [puzzle.id]);

  useEffect(() => {
    if (proofBlocks && proofBlocks.length > 0) {
      const userOrder = proofBlocks.map(block => block.id);
      const result = validator.validateProof(userOrder);
      setValidationResult(result);
      if (result.isCorrect && !completionReported && onPuzzleTried) {
        setCompletionReported(true);
        onPuzzleTried(puzzle.id, true);
      }
    } else {
      setValidationResult(null);
    }
  }, [proofBlocks, validator, completionReported, onPuzzleTried, puzzle.id]);

  if (!validationResult) {
    return (
      <div className="validation validation--empty card">
        <Lightbulb size={18} aria-hidden="true" />
        <p>Feedback on your proof appears here as you add steps.</p>
      </div>
    );
  }

  const { score, isCorrect, feedback, details, hints = [] } = validationResult;
  const tone = isCorrect ? 'success' : scoreTone(score);

  return (
    <section className={`validation validation--${tone} card`} aria-label="Proof feedback" aria-live="polite">
      <div className="validation__summary">
        <div className={`validation__score validation__score--${tone}`}>{score}%</div>
        <div className="validation__text">
          <p className="validation__status">
            {isCorrect ? <><CheckCircle2 size={18} aria-hidden="true" /> Correct!</> : 'Keep going'}
          </p>
          <p className="validation__feedback">{feedback}</p>
        </div>
      </div>

      {details && (
        <ul className="validation__stats">
          <li><span>Placed</span><strong>{details.userBlocks ?? proofBlocks.length} / {details.totalBlocks}</strong></li>
          {details.correctlyPositioned?.length > 0 && (
            <li><span>In the right place</span><strong className="validation__good">{details.correctlyPositioned.length}</strong></li>
          )}
          {details.incorrectlyPositioned?.length > 0 && (
            <li><span>Out of place</span><strong className="validation__bad">{details.incorrectlyPositioned.length}</strong></li>
          )}
        </ul>
      )}

      {hints.length > 0 && (
        <div className="validation__hints">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setShowHints(!showHints)}
            aria-expanded={showHints}
          >
            <Lightbulb size={15} aria-hidden="true" />
            {showHints ? 'Hide' : 'Show'} Hints ({hints.length})
            <ChevronDown size={15} aria-hidden="true" className={showHints ? 'validation__chevron--open' : ''} />
          </button>

          {showHints && (
            <ul className="validation__hint-list">
              {hints.map((hint, index) => {
                const Icon = HINT_ICONS[hint.type] || Lightbulb;
                return (
                  <li key={index} className="validation__hint">
                    <Icon size={16} aria-hidden="true" />
                    <div>
                      <p>{hint.message}</p>
                      {hint.latex && <div className="validation__hint-latex"><KatexRenderer latex={hint.latex} /></div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {isCorrect && (
        <div className="validation__actions">
          <button type="button" className="btn btn--primary" onClick={onNextPuzzle} disabled={!onNextPuzzle}>
            {isLastPuzzle ? 'Start Over' : 'Try Next Puzzle'} <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button type="button" className="btn" onClick={onReset} disabled={!onReset}>
            <RotateCcw size={15} aria-hidden="true" /> Reset & Try Again
          </button>
        </div>
      )}
    </section>
  );
};

export default ProofValidationDisplay;
