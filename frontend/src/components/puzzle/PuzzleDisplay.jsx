import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Clock, Eye, Footprints, Lock, RotateCcw, Send } from 'lucide-react';

import ProofBlock from './ProofBlock';
import ProofValidationDisplay from './ProofValidationDisplay';
import { KatexRenderer } from '../renderers';
import { answerSelections, checkSymbols } from '../../utils/placeholders';
import './PuzzleDisplay.css';

// Lockout challenge rules
const MAX_CONSEC_WRONG = 5;
const LOCK_SECONDS = 10;

// Timed challenge duration
const TIMED_SECONDS = 5 * 60;

// Limited-moves rule
const MAX_MOVES = 20;

const CHALLENGE_SUBMODES = [
  { type: 'lockout', label: 'Lockout', icon: Lock },
  { type: 'timed', label: 'Timed', icon: Clock },
  { type: 'limited', label: 'Limited moves', icon: Footprints },
];

const formatTime = (secs) => {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
};

// Most bundled titles are "\text{Prove } <statement>", so only show the
// statement separately when it says something the title doesn't.
const mathOnly = (latex) => String(latex ?? '').replace(/\\text\{[^}]*\}/g, '').replace(/\s+/g, '');
const statementAddsInfo = (title, statement) => {
  if (!statement || !statement.trim()) return false;
  const core = mathOnly(statement);
  return !core || !mathOnly(title).endsWith(core);
};

// Drop zones are module-level components so they keep their identity (and
// the blocks inside them) across renders.
function DropZone({ id, className, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className}${isOver ? ' drop-zone--over' : ''}`}>
      {children}
    </div>
  );
}

const PuzzleDisplay = ({ puzzle, onNextPuzzle, isLastPuzzle, onPuzzleTried, mode = 'practice' }) => {
  const isChallenge = mode === 'challenge';

  // internal sub-mode selector in challenge
  const [challengeModeType, setChallengeModeType] = useState('lockout');
  const isLockoutMode = isChallenge && challengeModeType === 'lockout';
  const isTimedMode = isChallenge && challengeModeType === 'timed';
  const isLimitedMovesMode = isChallenge && challengeModeType === 'limited';

  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [proofBlocks, setProofBlocks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [blockSelections, setBlockSelections] = useState({});
  const triedReported = useRef(false);

  useEffect(() => {
    triedReported.current = false;
    setSolutionShown(false);
  }, [puzzle]);

  // challenge-only state
  const [revealResults, setRevealResults] = useState(!isChallenge);
  // Once the solution is revealed, submitting it would bypass the challenge rules
  const [solutionShown, setSolutionShown] = useState(false);

  // submit confirmation (Lockout mode only)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // lockout-only state
  const [wrongStreak, setWrongStreak] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [now, setNow] = useState(Date.now());
  const isLocked = isLockoutMode && !!lockedUntil && now < lockedUntil;
  const secondsLeftLockout = isLocked ? Math.ceil((lockedUntil - now) / 1000) : 0;

  // timed-mode state
  const [timeLeft, setTimeLeft] = useState(TIMED_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  // limited-moves state
  const [movesLeft, setMovesLeft] = useState(MAX_MOVES);
  const [movesFinished, setMovesFinished] = useState(false);

  // persist lockout per puzzle
  const challengeStorageKey = useMemo(() => {
    const id = puzzle?.id ?? 'no-puzzle';
    return `challenge_lockout:${id}`;
  }, [puzzle?.id]);

  // evaluation
  const evaluation = useMemo(() => {
    if (!puzzle || !puzzle.solutionOrder) {
      return {
        canEvaluate: false,
        total: 0,
        correct: 0,
        percent: 0,
        isFullyCorrect: false,
        missing: 0,
        symbolErrors: 0,
      };
    }

    const solution = puzzle.solutionOrder;
    const total = solution.length;

    // A step counts only if it is in the right place and its symbols are right.
    let correct = 0;
    for (let i = 0; i < total; i++) {
      const block = proofBlocks[i];
      if (block?.id === solution[i] && checkSymbols(block.latex, blockSelections[block.id]).isCorrect) correct++;
    }
    const symbolErrors = proofBlocks.filter(block => !checkSymbols(block.latex, blockSelections[block.id]).isCorrect).length;

    const missing = Math.max(0, total - proofBlocks.length);
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const isFullyCorrect = correct === total && proofBlocks.length === total;

    return { canEvaluate: true, total, correct, percent, isFullyCorrect, missing, symbolErrors };
  }, [puzzle, proofBlocks, blockSelections]);

  // reset whenever puzzle or challenge sub-mode changes
  useEffect(() => {
    if (puzzle && puzzle.blocks) {
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
      setBlockSelections({});
      setActiveId(null);

      setRevealResults(!isChallenge);

      // close submit confirm on new puzzle / mode reset
      setShowSubmitConfirm(false);

      // reset lockout state
      setWrongStreak(0);
      setLockedUntil(null);

      // reset timed state
      setTimeLeft(TIMED_SECONDS);
      setTimerRunning(false);
      setTimerFinished(false);

      // reset limited-moves state
      setMovesLeft(MAX_MOVES);
      setMovesFinished(false);

      // restore lockout state only in lockout mode
      if (isLockoutMode) {
        try {
          const saved = localStorage.getItem(challengeStorageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            setLockedUntil(
              typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null
            );
            setWrongStreak(
              typeof parsed.wrongStreak === 'number' ? parsed.wrongStreak : 0
            );
          } else {
            setLockedUntil(null);
          }
        } catch {
          setLockedUntil(null);
          setWrongStreak(0);
        }
      } else {
        setLockedUntil(null);
      }
    }
  }, [puzzle, isChallenge, isLockoutMode, challengeStorageKey, challengeModeType]);

  // persist lockout state
  useEffect(() => {
    if (!isLockoutMode) return;
    try {
      localStorage.setItem(
        challengeStorageKey,
        JSON.stringify({ lockedUntil, wrongStreak })
      );
    } catch {
      // ignore
    }
  }, [isLockoutMode, challengeStorageKey, lockedUntil, wrongStreak]);

  // lockout countdown
  useEffect(() => {
    if (!isLocked) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isLocked]);

  // lockout end
  useEffect(() => {
    if (!lockedUntil) return;
    if (isLocked) return;

    setLockedUntil(null);
    setWrongStreak(0);
    setRevealResults(false);
  }, [isLocked, lockedUntil]);

  // close confirm when lockout begins (avoid stale confirm popup)
  useEffect(() => {
    if (isLocked) setShowSubmitConfirm(false);
  }, [isLocked]);

  // timed-mode countdown
  useEffect(() => {
    if (!isTimedMode) return;
    if (!timerRunning) return;
    if (timerFinished) return;

    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setTimerRunning(false);
          setTimerFinished(true);
          setRevealResults(true); // auto-show result
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isTimedMode, timerRunning, timerFinished]);

  // Mouse drags start after a small movement; touch drags need a short press
  // so that swiping still scrolls the page on phones.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const interactionDisabled =
    (isLockoutMode && isLocked) ||
    (isTimedMode && timerFinished) ||
    (isLimitedMovesMode && movesFinished);

  const submitBlocked =
    solutionShown ||
    (isLockoutMode && isLocked) ||
    (isLimitedMovesMode && movesFinished);

  const findContainer = (id) => {
    if (availableBlocks.find(item => item.id === id)) return 'palette';
    if (proofBlocks.find(item => item.id === id)) return 'workspace';
    return null;
  };

  const getBlockById = (id) => (
    availableBlocks.find(b => b.id === id) ||
    proofBlocks.find(b => b.id === id)
  );

  // Shared by drag-and-drop and the tap controls.
  const startInteraction = () => {
    if (isTimedMode && !timerRunning && timeLeft > 0) setTimerRunning(true);
  };

  const reportTried = () => {
    if (!triedReported.current && onPuzzleTried) {
      triedReported.current = true;
      onPuzzleTried(puzzle.id, false);
    }
  };

  const countMove = () => {
    if (!isLimitedMovesMode) return;
    setMovesLeft(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setMovesFinished(true);
        setRevealResults(true); // auto-grade when moves are used up
        return 0;
      }
      return next;
    });
  };

  const insertAt = (list, item, beforeId) => {
    const index = beforeId ? list.findIndex(entry => entry.id === beforeId) : -1;
    return index === -1 ? [...list, item] : [...list.slice(0, index), item, ...list.slice(index)];
  };

  // Moves a block between/within the palette and the proof. Returns true if
  // anything changed.
  const moveBlock = (blockId, target, beforeId = null) => {
    const source = findContainer(blockId);
    if (!source) return false;

    if (source === target) {
      if (!beforeId || beforeId === blockId) return false;
      const setList = target === 'palette' ? setAvailableBlocks : setProofBlocks;
      setList(items => {
        const oldIndex = items.findIndex(item => item.id === blockId);
        const newIndex = items.findIndex(item => item.id === beforeId);
        return newIndex === -1 ? items : arrayMove(items, oldIndex, newIndex);
      });
      return true;
    }

    const block = getBlockById(blockId);
    if (source === 'palette') {
      setAvailableBlocks(prev => prev.filter(item => item.id !== blockId));
      setProofBlocks(prev => insertAt(prev, block, beforeId));
    } else {
      setProofBlocks(prev => prev.filter(item => item.id !== blockId));
      setAvailableBlocks(prev => insertAt(prev, block, beforeId));
    }
    return true;
  };

  const tapMove = (apply) => {
    if (interactionDisabled) return;
    startInteraction();
    reportTried();
    if (apply()) countMove();
  };

  const addToProof = (blockId) => tapMove(() => moveBlock(blockId, 'workspace'));
  const removeFromProof = (blockId) => tapMove(() => moveBlock(blockId, 'palette'));
  const shiftInProof = (blockId, delta) => tapMove(() => {
    const index = proofBlocks.findIndex(item => item.id === blockId);
    const target = index + delta;
    if (index === -1 || target < 0 || target >= proofBlocks.length) return false;
    setProofBlocks(items => arrayMove(items, index, target));
    return true;
  });

  const handleDragStart = (event) => {
    if (interactionDisabled) return;
    startInteraction();
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    if (interactionDisabled) return;

    const { active, over } = event;
    if (!over) return;
    reportTried();

    const overContainer = findContainer(over.id) || over.id;
    if (overContainer !== 'palette' && overContainer !== 'workspace') return;
    const beforeId = over.id === overContainer ? null : over.id;
    if (moveBlock(active.id, overContainer, beforeId)) countMove();
  };

  const handleSelectionChange = (blockId, varType, value) => {
    setBlockSelections(prev => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        [varType]: value,
      },
    }));
  };

  const handleReset = () => {
    // keep lockout restriction (don’t allow bypass)
    if (isLockoutMode && isLocked) return;

    // close confirm on reset
    setShowSubmitConfirm(false);

    if (puzzle && puzzle.blocks) {
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
      setBlockSelections({});
      setActiveId(null);

      if (isChallenge) setRevealResults(false);

      if (isTimedMode) {
        setTimeLeft(TIMED_SECONDS);
        setTimerRunning(false);
        setTimerFinished(false);
      }

      if (isLimitedMovesMode) {
        setMovesLeft(MAX_MOVES);
        setMovesFinished(false);
      }
    }
  };

  const solutionLocked =
    (isLockoutMode && isLocked) ||
    (isTimedMode && !timerFinished) ||
    (isLimitedMovesMode && !movesFinished && !revealResults);

  const handleShowSolution = () => {
    if (solutionLocked) return;

    // close confirm if they show solution
    setShowSubmitConfirm(false);

    if (puzzle && puzzle.blocks && puzzle.solutionOrder) {
      const solutionBlocks = puzzle.solutionOrder
        .map(id => puzzle.blocks.find(block => block.id === id))
        .filter(Boolean);

      setProofBlocks(solutionBlocks);
      setAvailableBlocks([]);
      setBlockSelections(Object.fromEntries(
        puzzle.blocks.map(block => [block.id, answerSelections(block.latex)]),
      ));

      if (isChallenge) {
        setRevealResults(true);
        setSolutionShown(true);
      }
    }
  };

  const handleSubmit = () => {
    if (!isChallenge) return;

    // no manual submit in timed mode
    if (isTimedMode) return;

    if (solutionShown) return;

    if (isLockoutMode && isLocked) return;
    if (isLimitedMovesMode && movesFinished) return;

    // Lockout mode requires confirmation first
    if (isLockoutMode && !showSubmitConfirm) {
      setShowSubmitConfirm(true);
      return;
    }

    // confirmed submit (or non-lockout modes)
    setShowSubmitConfirm(false);
    setRevealResults(true);

    if (!evaluation.canEvaluate) return;

    if (evaluation.isFullyCorrect) {
      setWrongStreak(0);
      if (onPuzzleTried) onPuzzleTried(puzzle.id, true);
      return;
    }

    // lockout punishments only apply in lockout mode
    if (isLockoutMode) {
      setWrongStreak(prev => {
        const next = prev + 1;

        if (next >= MAX_CONSEC_WRONG) {
          const until = Date.now() + LOCK_SECONDS * 1000;
          setLockedUntil(until);
          setRevealResults(false);
          return 0;
        }

        return next;
      });
    }
  };

  const activeBlock = activeId ? getBlockById(activeId) : null;

  if (!puzzle) {
    return <p>Loading puzzle...</p>;
  }

  const showStatement = statementAddsInfo(puzzle.title, puzzle.statement);
  const showSubmit = isLockoutMode || isLimitedMovesMode;
  const isLockedOut = isLockoutMode && isLocked;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <section className="puzzle" aria-labelledby="puzzle-title">
        <div className="card puzzle__header">
          <h2 id="puzzle-title" className="puzzle__title"><KatexRenderer latex={puzzle.title} /></h2>
          {showStatement && (
            <p className="puzzle__statement"><KatexRenderer latex={puzzle.statement} /></p>
          )}

          {isChallenge && (
            <div className="puzzle__challenge">
              <div className="segmented" role="radiogroup" aria-label="Challenge type">
                {CHALLENGE_SUBMODES.map((submode) => {
                  const Icon = submode.icon;
                  const active = challengeModeType === submode.type;
                  return (
                    <button
                      key={submode.type}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className="segmented__option"
                      onClick={() => setChallengeModeType(submode.type)}
                    >
                      <Icon size={15} aria-hidden="true" />
                      {submode.label}
                    </button>
                  );
                })}
              </div>

              <div className={`notice ${isLockedOut ? 'notice--danger' : 'notice--info'} puzzle__rules`} role="status">
                {isLockoutMode && (isLocked ? (
                  <span><strong>Lockout Mode:</strong> Locked. Try again in <strong>{secondsLeftLockout}s</strong>.</span>
                ) : (
                  <span>
                    <strong>Lockout Mode:</strong> results appear only when you press Submit.
                    Consecutive wrong submits: <strong>{wrongStreak}/{MAX_CONSEC_WRONG}</strong>.
                  </span>
                ))}
                {isTimedMode && (
                  <span>
                    <strong>Timed Mode:</strong> Time left <strong className="puzzle__timer">{formatTime(timeLeft)}</strong>.{' '}
                    {timerFinished
                      ? 'Time is up. Your last attempt has been graded automatically.'
                      : 'The timer starts with your first move.'}
                  </span>
                )}
                {isLimitedMovesMode && (
                  <span>
                    <strong>Limited Moves Mode:</strong> You have <strong>{movesLeft}</strong> move(s) left.{' '}
                    {movesFinished
                      ? 'Moves are over. Your attempt has been graded automatically.'
                      : 'Plan before moving steps.'}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="puzzle__actions">
            <button type="button" className="btn btn--sm" onClick={handleReset} disabled={isLockedOut}>
              <RotateCcw size={15} aria-hidden="true" /> Reset
            </button>
            <button type="button" className="btn btn--sm" onClick={handleShowSolution} disabled={solutionLocked}>
              <Eye size={15} aria-hidden="true" /> Show solution
            </button>
            {showSubmit && (
              <button
                type="button"
                className="btn btn--sm btn--success puzzle__submit"
                onClick={handleSubmit}
                disabled={submitBlocked || (isLockoutMode && showSubmitConfirm)}
              >
                <Send size={15} aria-hidden="true" /> Submit
              </button>
            )}
          </div>

          {isLockoutMode && showSubmitConfirm && !isLocked && (
            <div className="notice notice--warning puzzle__confirm" role="alertdialog" aria-label="Confirm submission">
              <div>
                <strong>Are you sure you want to submit?</strong>
                <p className="puzzle__confirm-text">Submitting an incorrect answer counts toward lockout.</p>
                <div className="cluster">
                  <button type="button" className="btn btn--sm btn--success" onClick={() => handleSubmit()}>
                    Yes, submit
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => setShowSubmitConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {isChallenge && revealResults && evaluation.canEvaluate && (
            <div className={`notice ${evaluation.isFullyCorrect ? 'notice--success' : 'notice--warning'} puzzle__result`} role="status">
              <span>
                <strong>Result:</strong> {evaluation.percent}% correct ({evaluation.correct}/{evaluation.total} steps correct)
                {evaluation.missing > 0 ? ` • Missing ${evaluation.missing} step(s)` : ''}
                {evaluation.symbolErrors > 0 ? ` • ${evaluation.symbolErrors} step(s) with a symbol to fix` : ''}
                {evaluation.isFullyCorrect ? ' • Fully correct!' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="puzzle__board">
          <section className="board-column board-column--proof" aria-labelledby="proof-heading">
            <div className="board-column__header">
              <h3 id="proof-heading" className="board-column__title">Your proof</h3>
              <span className="badge">{proofBlocks.length}/{puzzle.blocks.length}</span>
            </div>
            <SortableContext items={proofBlocks.map(b => b.id)} strategy={verticalListSortingStrategy} id="workspace">
              <DropZone id="workspace" className="drop-zone puzzle-workspace">
                {proofBlocks.map((block, index) => (
                  <ProofBlock
                    key={block.id}
                    id={block.id}
                    latexContent={block.latex}
                    pedagogicalRole={block.pedagogicalRole}
                    isInWorkspace
                    stepNumber={index + 1}
                    blockSelections={blockSelections[block.id] || {}}
                    onSelectionChange={handleSelectionChange}
                    disabled={interactionDisabled}
                    onMoveUp={() => shiftInProof(block.id, -1)}
                    onMoveDown={() => shiftInProof(block.id, 1)}
                    canMoveUp={index > 0}
                    canMoveDown={index < proofBlocks.length - 1}
                    onRemove={() => removeFromProof(block.id)}
                  />
                ))}
                {proofBlocks.length === 0 && (
                  <p className="drop-zone__empty">
                    <span className="drop-zone__hint--touch">Tap + on a step to add it here.</span>
                    <span className="drop-zone__hint--pointer">Drag steps here, or use + to add them.</span>
                  </p>
                )}
              </DropZone>
            </SortableContext>
          </section>

          <section className="board-column board-column--steps" aria-labelledby="steps-heading">
            <div className="board-column__header">
              <h3 id="steps-heading" className="board-column__title">Available steps</h3>
              <span className="badge">{availableBlocks.length}</span>
            </div>
            <SortableContext items={availableBlocks.map(b => b.id)} strategy={verticalListSortingStrategy} id="palette">
              <DropZone id="palette" className="drop-zone puzzle-palette">
                {availableBlocks.map(block => (
                  <ProofBlock
                    key={block.id}
                    id={block.id}
                    latexContent={block.latex}
                    pedagogicalRole={block.pedagogicalRole}
                    isInWorkspace={false}
                    blockSelections={blockSelections[block.id] || {}}
                    onSelectionChange={handleSelectionChange}
                    disabled={interactionDisabled}
                    onAdd={() => addToProof(block.id)}
                  />
                ))}
                {availableBlocks.length === 0 && (
                  <p className="drop-zone__empty">All blocks are in use</p>
                )}
              </DropZone>
            </SortableContext>
          </section>
        </div>

        {!isChallenge && (
          <ProofValidationDisplay
            puzzle={puzzle}
            proofBlocks={proofBlocks}
            blockSelections={blockSelections}
            onReset={handleReset}
            onNextPuzzle={onNextPuzzle}
            isLastPuzzle={isLastPuzzle}
            onPuzzleTried={onPuzzleTried}
          />
        )}
      </section>

      <DragOverlay dropAnimation={null}>
        {activeId && activeBlock ? (
          <ProofBlock
            id={activeBlock.id}
            latexContent={activeBlock.latex}
            pedagogicalRole={activeBlock.pedagogicalRole}
            blockSelections={blockSelections[activeBlock.id] || {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PuzzleDisplay;
