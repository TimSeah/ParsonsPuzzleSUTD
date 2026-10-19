import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import ProofBlock from './ProofBlock';
import ProofValidationDisplay from './ProofValidationDisplay';
import { KatexRenderer } from '../renderers';
import './PuzzleDisplay.css';

// Lockout challenge rules
const MAX_CONSEC_WRONG = 5;
const LOCK_SECONDS = 10;

// Timed challenge duration (10s now, later 5 * 60)
const TIMED_SECONDS = 10;

// ✅ NEW: Limited-moves rule
const MAX_MOVES = 20;

const PuzzleDisplay = ({ puzzle, onNextPuzzle, isLastPuzzle, mode = 'practice' }) => {
  const isChallenge = mode === 'challenge';

  // internal sub-mode selector in challenge
  const [challengeModeType, setChallengeModeType] = useState('lockout');
  const isLockoutMode = isChallenge && challengeModeType === 'lockout';
  const isTimedMode = isChallenge && challengeModeType === 'timed';
  const isLimitedMovesMode = isChallenge && challengeModeType === 'limited'; // ✅ NEW

  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [proofBlocks, setProofBlocks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [blockSelections, setBlockSelections] = useState({});

  // challenge-only state
  const [revealResults, setRevealResults] = useState(!isChallenge);

  // ✅ NEW: submit confirmation (Lockout mode only)
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

  // ✅ NEW: limited-moves state
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
      };
    }

    const solution = puzzle.solutionOrder;
    const total = solution.length;

    let correct = 0;
    for (let i = 0; i < total; i++) {
      if (proofBlocks[i]?.id === solution[i]) correct++;
    }

    const missing = Math.max(0, total - proofBlocks.length);
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    const isFullyCorrect = correct === total && proofBlocks.length === total;

    return { canEvaluate: true, total, correct, percent, isFullyCorrect, missing };
  }, [puzzle, proofBlocks]);

  // reset whenever puzzle or challenge sub-mode changes
  useEffect(() => {
    if (puzzle && puzzle.blocks) {
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
      setBlockSelections({});
      setActiveId(null);

      setRevealResults(!isChallenge);

      // ✅ close submit confirm on new puzzle / mode reset
      setShowSubmitConfirm(false);

      // reset lockout state
      setWrongStreak(0);
      setLockedUntil(null);

      // reset timed state
      setTimeLeft(TIMED_SECONDS);
      setTimerRunning(false);
      setTimerFinished(false);

      // ✅ reset limited-moves state
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

  // ✅ close confirm when lockout begins (avoid stale confirm popup)
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const interactionDisabled =
    (isLockoutMode && isLocked) ||
    (isTimedMode && timerFinished) ||
    (isLimitedMovesMode && movesFinished);

  const findContainer = (id) => {
    if (availableBlocks.find(item => item.id === id)) return 'palette';
    if (proofBlocks.find(item => item.id === id)) return 'workspace';
    return null;
  };

  const getBlockById = (id) => {
    return (
      availableBlocks.find(b => b.id === id) ||
      proofBlocks.find(b => b.id === id)
    );
  };

  const handleDragStart = (event) => {
    if (interactionDisabled) return;

    // auto-start timer on first interaction
    if (isTimedMode && !timerRunning && timeLeft > 0) {
      setTimerRunning(true);
    }

    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event) => {
    if (interactionDisabled) {
      setActiveId(null);
      return;
    }

    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId) || over.id;

    if (!activeContainer || !overContainer) return;

    // ✅ track whether a real move happened (for Limited Moves Mode)
    let didMove = false;

    if (activeContainer === overContainer) {
      if (activeContainer === 'palette') {
        if (activeId !== overId) {
          didMove = true;
          setAvailableBlocks(items => {
            const oldIndex = items.findIndex(item => item.id === activeId);
            const newIndex = items.findIndex(item => item.id === overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      } else if (activeContainer === 'workspace') {
        if (activeId !== overId) {
          didMove = true;
          setProofBlocks(items => {
            const oldIndex = items.findIndex(item => item.id === activeId);
            const newIndex = items.findIndex(item => item.id === overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      }
    } else {
      let itemToMove;
      if (activeContainer === 'palette') {
        itemToMove = availableBlocks.find(item => item.id === activeId);
        if (!itemToMove) return;

        didMove = true;
        setAvailableBlocks(prev => prev.filter(item => item.id !== activeId));
        setProofBlocks(prev => {
          const overIndex = prev.findIndex(item => item.id === overId);
          if (overIndex !== -1) {
            return [
              ...prev.slice(0, overIndex),
              itemToMove,
              ...prev.slice(overIndex),
            ];
          }
          return [...prev, itemToMove];
        });
      } else {
        itemToMove = proofBlocks.find(item => item.id === activeId);
        if (!itemToMove) return;

        didMove = true;
        setProofBlocks(prev => prev.filter(item => item.id !== activeId));
        setAvailableBlocks(prev => {
          const overIndex = prev.findIndex(item => item.id === overId);
          if (overIndex !== -1) {
            return [
              ...prev.slice(0, overIndex),
              itemToMove,
              ...prev.slice(overIndex),
            ];
          }
          return [...prev, itemToMove];
        });
      }
    }

    // ✅ Limited Moves deduction (only if a real move happened)
    if (isLimitedMovesMode && didMove) {
      setMovesLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setMovesFinished(true);
          setRevealResults(true); // auto-grade when moves are used up
          return 0;
        }
        return next;
      });
    }
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

    // ✅ close confirm on reset
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

  const handleShowSolution = () => {
    if (isLockoutMode && isLocked) return;
    // only allow solution after time is up in timed mode
    if (isTimedMode && !timerFinished) return;
    // only allow solution after moves end (or after submit) in limited mode
    if (isLimitedMovesMode && !movesFinished && !revealResults) return;

    // ✅ close confirm if they show solution
    setShowSubmitConfirm(false);

    if (puzzle && puzzle.blocks && puzzle.solutionOrder) {
      const solutionBlocks = puzzle.solutionOrder
        .map(id => puzzle.blocks.find(block => block.id === id))
        .filter(Boolean);

      setProofBlocks(solutionBlocks);
      setAvailableBlocks([]);

      if (isChallenge) setRevealResults(true);
    }
  };

  const handleSubmit = () => {
    if (!isChallenge) return;

    // no manual submit in timed mode
    if (isTimedMode) return;

    if (isLockoutMode && isLocked) return;
    if (isLimitedMovesMode && movesFinished) return;

    // ✅ Lockout mode requires confirmation first
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

  const PaletteDroppable = ({ children }) => {
    const { setNodeRef } = useDroppable({ id: 'palette' });
    return (
      <div ref={setNodeRef} className="puzzle-palette droppable-area">
        {children}
      </div>
    );
  };

  const WorkspaceDroppable = ({ children }) => {
    const { setNodeRef } = useDroppable({ id: 'workspace' });
    return (
      <div ref={setNodeRef} className="puzzle-workspace droppable-area">
        {children}
      </div>
    );
  };

  const activeBlock = activeId ? getBlockById(activeId) : null;

  if (!puzzle) {
    return <p>Loading puzzle...</p>;
  }

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <DndContext
      sensors={interactionDisabled ? [] : sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="puzzle-container">
        <div className="puzzle-header">
          <h2><KatexRenderer latex={puzzle.title} /></h2>
          <p><strong><KatexRenderer latex={puzzle.statement} /></strong></p>

          {/* challenge sub-mode selector */}
          {isChallenge && (
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => setChallengeModeType('lockout')}
                className="control-button"
                style={{
                  marginRight: 8,
                  fontWeight: challengeModeType === 'lockout' ? 700 : 400,
                  background:
                    challengeModeType === 'lockout'
                      ? 'rgba(56,189,248,0.25)'
                      : 'rgba(255,255,255,0.06)',
                }}
              >
                🔒 Lockout mode
              </button>

              <button
                onClick={() => setChallengeModeType('timed')}
                className="control-button"
                style={{
                  marginRight: 8,
                  fontWeight: challengeModeType === 'timed' ? 700 : 400,
                  background:
                    challengeModeType === 'timed'
                      ? 'rgba(56,189,248,0.25)'
                      : 'rgba(255,255,255,0.06)',
                }}
              >
                ⏱ Timed mode
              </button>

              {/* ✅ NEW: Limited moves */}
              <button
                onClick={() => setChallengeModeType('limited')}
                className="control-button"
                style={{
                  fontWeight: challengeModeType === 'limited' ? 700 : 400,
                  background:
                    challengeModeType === 'limited'
                      ? 'rgba(56,189,248,0.25)'
                      : 'rgba(255,255,255,0.06)',
                }}
              >
                🎯 Limited moves
              </button>
            </div>
          )}

          {/* controls */}
          <div className="puzzle-controls">
            <button
              className="control-button reset"
              onClick={handleReset}
              disabled={isLockoutMode && isLocked}
              style={(isLockoutMode && isLocked) ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              🔄 Reset
            </button>

            <button
              className="control-button solution"
              onClick={handleShowSolution}
              disabled={
                (isLockoutMode && isLocked) ||
                (isTimedMode && !timerFinished) ||
                (isLimitedMovesMode && !movesFinished && !revealResults)
              }
              style={
                (isLockoutMode && isLocked) ||
                (isTimedMode && !timerFinished) ||
                (isLimitedMovesMode && !movesFinished && !revealResults)
                  ? { opacity: 0.5, cursor: 'not-allowed' }
                  : undefined
              }
            >
              💡 Show Solution
            </button>

            {/* Submit in practice OR lockout OR limited-moves (NOT timed) */}
            {(!isChallenge || isLockoutMode || isLimitedMovesMode) && (
              <button
                className="control-button"
                onClick={handleSubmit}
                disabled={
                  (isLockoutMode && (isLocked || showSubmitConfirm)) ||(isLimitedMovesMode && movesFinished)
                }

                style={{
                  marginLeft: 8,
                  background:
                    (isLockoutMode && isLocked) || (isLimitedMovesMode && movesFinished)
                      ? 'var(--color-canvas-subtle)'
                      : '#15803d',
                  border: '1px solid var(--color-border-default)',
                  color:
                    (isLockoutMode && isLocked) || (isLimitedMovesMode && movesFinished)
                      ? 'var(--color-fg-muted)'
                      : '#ffffff',
                  cursor:
                    (isLockoutMode && isLocked) || (isLimitedMovesMode && movesFinished)
                      ? 'not-allowed'
                      : 'pointer',
                  fontWeight: 700,
                }}
              >
                ✅ Submit
              </button>
            )}
          </div>

          {/* ✅ NEW: Lockout-only Submit confirmation prompt */}
          {isLockoutMode && showSubmitConfirm && !isLocked && (
            <div
              style={{
                marginTop: 10,
                padding: '12px 12px',
                borderRadius: 10,
                border: '1px solid rgba(248,113,113,0.55)',
                background: 'rgba(248,113,113,0.12)',
                color: 'var(--color-fg-default)',
                fontSize: 14,
                lineHeight: 1.35,
              }}
            >
              <strong>Are you sure you want to submit?</strong>
              <div style={{ marginTop: 6, opacity: 0.9 }}>
                Submitting an incorrect answer counts toward lockout.
              </div>

              <div style={{ marginTop: 10 }}>
                <button
                  className="control-button"
                  style={{
                    marginRight: 8,
                    background: 'rgba(34,197,94,0.22)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    fontWeight: 800,
                  }}
                  onClick={() => handleSubmit()}
                >
                  ✅ Yes, submit
                </button>

                <button
                  className="control-button"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                  onClick={() => setShowSubmitConfirm(false)}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}

          {/* challenge banner */}
          {isChallenge && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: (isLockoutMode && isLocked)
                  ? '1px solid rgba(248,113,113,0.55)'
                  : '1px solid rgba(56,189,248,0.35)',
                background: (isLockoutMode && isLocked)
                  ? 'rgba(248,113,113,0.10)'
                  : 'rgba(56,189,248,0.08)',
                color: 'var(--color-fg-default)',
                fontSize: 14,
                lineHeight: 1.35,
              }}
            >
              {isLockoutMode ? (
                isLocked ? (
                  <>
                    <strong>Lockout Mode:</strong> Locked. Try again in{' '}
                    <strong>{secondsLeftLockout}s</strong>.
                  </>
                ) : (
                  <>
                    <strong>Lockout Mode:</strong> No progress shown until you press{' '}
                    <strong>Submit</strong>. Consecutive wrong submits:{' '}
                    {wrongStreak}/{MAX_CONSEC_WRONG}.
                  </>
                )
              ) : isTimedMode ? (
                <>
                  <strong>Timed Mode:</strong> Time left{' '}
                  <strong>{formatTime(timeLeft)}</strong>.{' '}
                  {timerFinished
                    ? 'Time is up. Your last attempt has been graded automatically.'
                    : 'Build your proof before the timer reaches zero.'}
                </>
              ) : (
                <>
                  <strong>Limited Moves Mode:</strong> You have{' '}
                  <strong>{movesLeft}</strong> move(s) left.{' '}
                  {movesFinished
                    ? 'Moves are over. Your attempt has been graded automatically.'
                    : 'Plan before dragging to avoid wasting moves.'}
                </>
              )}
            </div>
          )}

          {/* results */}
          {isChallenge && revealResults && evaluation.canEvaluate && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-canvas-subtle)',
                color: 'var(--color-fg-default)',
                fontSize: 14,
                lineHeight: 1.35,
              }}
            >
              <strong>Result:</strong> {evaluation.percent}% correct (
              {evaluation.correct}/{evaluation.total} steps in correct position)
              {evaluation.missing > 0
                ? ` • Missing ${evaluation.missing} step(s)`
                : ''}
              {evaluation.isFullyCorrect ? ' • ✅ Fully correct!' : ''}
            </div>
          )}
        </div>

        <div className="dnd-columns-container">
          <div className="puzzle-palette-container">
            <h3>Available Steps:</h3>
            <SortableContext
              items={availableBlocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
              id="palette"
            >
              <PaletteDroppable>
                {availableBlocks.map(block => (
                  <ProofBlock
                    key={block.id}
                    id={block.id}
                    latexContent={block.latex}
                    isInWorkspace={false}
                    blockSelections={blockSelections[block.id] || {}}
                    onSelectionChange={handleSelectionChange}
                    disabled={interactionDisabled}
                  />
                ))}
                {availableBlocks.length === 0 && (
                  <div className="empty-message">All blocks are in use</div>
                )}
              </PaletteDroppable>
            </SortableContext>
          </div>

          <div className="puzzle-workspace-container">
            <h3>Your Proof:</h3>
            <SortableContext
              items={proofBlocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
              id="workspace"
            >
              <WorkspaceDroppable>
                {proofBlocks.map((block, index) => (
                  <div key={block.id} className="proof-step">
                    <span className="step-number">{index + 1}.</span>
                    <ProofBlock
                      id={block.id}
                      latexContent={block.latex}
                      isInWorkspace={true}
                      blockSelections={blockSelections[block.id] || {}}
                      onSelectionChange={handleSelectionChange}
                      disabled={interactionDisabled}
                    />
                  </div>
                ))}
                {proofBlocks.length === 0 && (
                  <div className="empty-message">
                    Drag steps here to build your proof
                  </div>
                )}
              </WorkspaceDroppable>
            </SortableContext>
          </div>
        </div>

        {!isChallenge && (
          <ProofValidationDisplay
            puzzle={puzzle}
            proofBlocks={proofBlocks}
            onReset={handleReset}
            onNextPuzzle={onNextPuzzle}
            isLastPuzzle={isLastPuzzle}
          />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId && activeBlock ? (
          <ProofBlock
            id={activeBlock.id}
            latexContent={activeBlock.latex}
            isOverlay={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PuzzleDisplay;

//Challenge mode introduces structured constraints to encourage deeper reasoning and disciplined problem-solving. Lockout mode limits repeated incorrect submissions, prompting students to pause and reflect between attempts rather than relying on rapid trial-and-error. Timed mode imposes a time constraint that promotes fluency and retrieval of proof structure under pressure, similar to assessment conditions. Limited moves mode restricts the number of allowed actions, encouraging students to plan their proof carefully before manipulating steps, thereby shifting focus from exploratory dragging to deliberate, expert-like reasoning. Together, these modes assess complementary skills while discouraging brute-force strategies.

  //Lockout mode discourages repeated incorrect submissions by limiting how often students can retry, while limited moves mode discourages trial-and-error construction by restricting how many actions students can take. Together, they target different forms of unproductive problem-solving behavior.

    //Confirm submission ("Are you sure you want to submit?") in Lockout Mode to encourage reflection and avoid accidental lockouts

