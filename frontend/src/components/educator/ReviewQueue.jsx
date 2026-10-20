import { useCallback, useEffect, useState } from 'react';
import { Check, ClipboardCheck, KeyRound, RefreshCw, X } from 'lucide-react';
import { KatexRenderer } from '../renderers';
import { LoadingState } from '../ui';
import puzzleService from '../../services/puzzleService.js';
import styles from './ReviewQueue.module.css';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

function ReviewItem({ puzzle, onDecide, busy }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const blocks = new Map(puzzle.blocks.map((block) => [block.id, block]));
  const steps = puzzle.solutionOrder.map((id) => blocks.get(id)).filter(Boolean);
  const titleId = `review-${puzzle.id}`;

  return (
    <li className={styles.item}>
      <article aria-labelledby={titleId}>
        <h3 id={titleId} className={styles.itemTitle}>{puzzle.displayTitle}</h3>
        <p className={styles.meta}>
          {[puzzle.category, puzzle.difficulty, puzzle.model, formatDate(puzzle.createdAt)].filter(Boolean).join(' · ')}
        </p>
        <div className={styles.statement}><KatexRenderer latex={puzzle.statement} revealAnswers /></div>

        <details className={styles.details}>
          <summary>Steps in the intended order ({steps.length})</summary>
          <ol className={styles.steps}>
            {steps.map((block) => <li key={block.id}><KatexRenderer latex={block.latex} revealAnswers /></li>)}
          </ol>
        </details>
        <details className={styles.details}>
          <summary>Lean theorem {puzzle.lean.theoremName ? <code>{puzzle.lean.theoremName}</code> : null}</summary>
          <pre className={styles.lean}><code>{puzzle.lean.source}</code></pre>
          <p className={styles.meta}>Axioms: {puzzle.verification.axioms.length ? puzzle.verification.axioms.join(', ') : 'none'}</p>
        </details>

        {rejecting ? (
          <div className={styles.reject}>
            <label className="field__label" htmlFor={`${titleId}-note`}>Reason (optional)</label>
            <input
              id={`${titleId}-note`}
              className="input"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. the theorem proves a weaker statement"
            />
            <div className="cluster">
              <button type="button" className="btn btn--danger btn--sm" disabled={busy} onClick={() => onDecide(puzzle, 'reject', note)}>
                <X size={16} aria-hidden="true" /> Reject puzzle
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setRejecting(false); setNote(''); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="cluster">
            <button type="button" className="btn btn--success btn--sm" disabled={busy} onClick={() => onDecide(puzzle, 'approve')}>
              <Check size={16} aria-hidden="true" /> Approve
            </button>
            <button type="button" className="btn btn--sm" disabled={busy} onClick={() => setRejecting(true)}>
              <X size={16} aria-hidden="true" /> Reject…
            </button>
          </div>
        )}
      </article>
    </li>
  );
}

// AI-generated puzzles waiting for an educator to confirm the Lean theorem
// says what the puzzle claims. Approved puzzles can be given to other students.
function ReviewQueue({ isSignedIn, onSignIn, onAuthExpired }) {
  const [state, setState] = useState({ status: 'idle', puzzles: [], total: 0, error: '' });
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');

  const handleError = useCallback((error) => {
    if (error.status === 401) {
      onAuthExpired();
      return true;
    }
    return false;
  }, [onAuthExpired]);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: '' }));
    setMessage('');
    try {
      const { puzzles, total } = await puzzleService.getReviewQueue();
      setState({ status: 'ready', puzzles, total, error: '' });
    } catch (error) {
      if (!handleError(error)) setState((s) => ({ ...s, status: 'error', error: error.message }));
    }
  }, [handleError]);

  useEffect(() => {
    if (isSignedIn) load();
    else setState({ status: 'idle', puzzles: [], total: 0, error: '' });
  }, [isSignedIn, load]);

  const decide = async (puzzle, decision, note) => {
    setBusyId(puzzle.id);
    setMessage('');
    try {
      await puzzleService.reviewPuzzle(puzzle.id, decision, note);
      setState((s) => ({ ...s, puzzles: s.puzzles.filter((p) => p.id !== puzzle.id), total: Math.max(0, s.total - 1) }));
      setMessage(`${decision === 'approve' ? 'Approved' : 'Rejected'}: ${puzzle.displayTitle}`);
    } catch (error) {
      if (handleError(error)) return;
      if (error.status === 404) {
        setState((s) => ({ ...s, puzzles: s.puzzles.filter((p) => p.id !== puzzle.id) }));
        setMessage(`${puzzle.displayTitle} was already reviewed.`);
      } else {
        setMessage(`Could not save the review: ${error.message}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card" aria-labelledby="review-heading">
      <div className={styles.header}>
        <h2 id="review-heading" className="card-title">
          <ClipboardCheck size={18} aria-hidden="true" /> Review queue
          {state.status === 'ready' && <span className="badge">{state.total}</span>}
        </h2>
        {isSignedIn && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={load} disabled={state.status === 'loading'}>
            <RefreshCw size={16} aria-hidden="true" /> Refresh
          </button>
        )}
      </div>
      <p className={styles.intro}>
        Lean checks that each AI-generated proof is correct, not that it proves what the puzzle says. Check the statement
        matches the Lean theorem. Only the student who generated a puzzle sees it until you approve it.
      </p>

      {!isSignedIn && (
        <button type="button" className="btn btn--sm" onClick={onSignIn}>
          <KeyRound size={16} aria-hidden="true" /> Sign in to review
        </button>
      )}
      {state.status === 'loading' && <LoadingState size="small" title="Loading the review queue" />}
      {state.status === 'error' && (
        <div className="notice notice--danger" role="alert">
          <span>{state.error}</span>
          <button type="button" className="btn btn--sm" onClick={load}>Try again</button>
        </div>
      )}
      <div role="status" className={message ? 'notice notice--success' : 'visually-hidden'}>{message}</div>
      {state.status === 'ready' && state.puzzles.length === 0 && <p className={styles.empty}>Nothing to review.</p>}
      {state.puzzles.length > 0 && (
        <ul className={styles.list}>
          {state.puzzles.map((puzzle) => (
            <ReviewItem key={puzzle.id} puzzle={puzzle} onDecide={decide} busy={busyId === puzzle.id} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default ReviewQueue;
