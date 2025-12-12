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

// Challenge rules
const MAX_CONSEC_WRONG = 5;
const LOCK_SECONDS = 10;

const PuzzleDisplay = ({ puzzle, onNextPuzzle, isLastPuzzle, mode = 'practice' }) => {
  const isChallenge = mode === 'challenge';

  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [proofBlocks, setProofBlocks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [blockSelections, setBlockSelections] = useState({});

  // Challenge-only state
  const [revealResults, setRevealResults] = useState(!isChallenge);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [now, setNow] = useState(Date.now());

  const isLocked = !!lockedUntil && now < lockedUntil;
  const secondsLeft = isLocked ? Math.ceil((lockedUntil - now) / 1000) : 0;

  // Persist challenge lockout per puzzle (prevents refresh bypass)
  const challengeStorageKey = useMemo(() => {
    const id = puzzle?.id ?? 'no-puzzle';
    return `challenge_lockout:${id}`;
  }, [puzzle?.id]);

  // Basic scoring based on correct positions vs solutionOrder
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

  useEffect(() => {
    if (puzzle && puzzle.blocks) {
      // Shuffle the blocks for the puzzle
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
      setBlockSelections({});
      setActiveId(null);

      // Reset challenge UI for new puzzle / mode
      setRevealResults(!isChallenge);
      setWrongStreak(0);

      // Load persisted lockout state
      if (isChallenge) {
        try {
          const saved = localStorage.getItem(challengeStorageKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            setLockedUntil(typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null);
            setWrongStreak(typeof parsed.wrongStreak === 'number' ? parsed.wrongStreak : 0);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, isChallenge, challengeStorageKey]);

  // Persist lockout state
  useEffect(() => {
    if (!isChallenge) return;
    try {
      localStorage.setItem(
        challengeStorageKey,
        JSON.stringify({ lockedUntil, wrongStreak })
      );
    } catch {
      // ignore
    }
  }, [isChallenge, challengeStorageKey, lockedUntil, wrongStreak]);

  // Tick countdown while locked
  useEffect(() => {
    if (!isLocked) return;
    const id = setInterval(() => setNow(Date.now()), 10000); //changed 250 to 10000, but now the lockout time display changes 
    return () => clearInterval(id);
  }, [isLocked]);

  // When lock ends, allow them to try again
  useEffect(() => {
    if (!lockedUntil) return;
    if (isLocked) return;

    setLockedUntil(null);
    setWrongStreak(0);
    setRevealResults(false); // make them Submit again to see results
  }, [isLocked, lockedUntil]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const findContainer = (id) => {
    if (availableBlocks.find(item => item.id === id)) return 'palette';
    if (proofBlocks.find(item => item.id === id)) return 'workspace';
    return null;
  };

  const getBlockById = (id) => {
    return availableBlocks.find(b => b.id === id) || proofBlocks.find(b => b.id === id);
  };

  const handleDragStart = (event) => {
    if (isChallenge && isLocked) return; // disable during lockout
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event) => {
    if (isChallenge && isLocked) {
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

    if (activeContainer === overContainer) {
      // Reordering within the same list
      if (activeContainer === 'palette') {
        if (activeId !== overId) {
          setAvailableBlocks((items) => {
            const oldIndex = items.findIndex(item => item.id === activeId);
            const newIndex = items.findIndex(item => item.id === overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      } else if (activeContainer === 'workspace') {
        if (activeId !== overId) {
          setProofBlocks((items) => {
            const oldIndex = items.findIndex(item => item.id === activeId);
            const newIndex = items.findIndex(item => item.id === overId);
            return arrayMove(items, oldIndex, newIndex);
          });
        }
      }
    } else {
      // Moving from one list to another
      let itemToMove;
      if (activeContainer === 'palette') {
        itemToMove = availableBlocks.find(item => item.id === activeId);
        if (!itemToMove) return;

        setAvailableBlocks(prev => prev.filter(item => item.id !== activeId));
        setProofBlocks(prev => {
          const overIndex = prev.findIndex(item => item.id === overId);
          if (overIndex !== -1) {
            return [...prev.slice(0, overIndex), itemToMove, ...prev.slice(overIndex)];
          }
          return [...prev, itemToMove];
        });
      } else {
        itemToMove = proofBlocks.find(item => item.id === activeId);
        if (!itemToMove) return;

        setProofBlocks(prev => prev.filter(item => item.id !== activeId));
        setAvailableBlocks(prev => {
          const overIndex = prev.findIndex(item => item.id === overId);
          if (overIndex !== -1) {
            return [...prev.slice(0, overIndex), itemToMove, ...prev.slice(overIndex)];
          }
          return [...prev, itemToMove];
        });
      }
    }
  };

  const handleSelectionChange = (blockId, varType, value) => {
    setBlockSelections(prev => ({
      ...prev,
      [blockId]: {
        ...prev[blockId],
        [varType]: value
      }
    }));
  };

  const handleReset = () => {
    if (isChallenge && isLocked) return;

    if (puzzle && puzzle.blocks) {
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
      setBlockSelections({});
      setActiveId(null);

      // Challenge: hide results after reset
      if (isChallenge) setRevealResults(false);
    }
  };

  const handleShowSolution = () => {
    if (isChallenge && isLocked) return;

    if (puzzle && puzzle.blocks && puzzle.solutionOrder) {
      const solutionBlocks = puzzle.solutionOrder
        .map(id => puzzle.blocks.find(block => block.id === id))
        .filter(Boolean);

      setProofBlocks(solutionBlocks);
      setAvailableBlocks([]);

      // In challenge, showing solution basically reveals results
      if (isChallenge) setRevealResults(true);
    }
  };

  const handleSubmit = () => {
    if (!isChallenge) return;
    if (isLocked) return;

    // Reveal results only on submit
    setRevealResults(true);

    // We evaluate correctness right here (based on solutionOrder)
    if (!evaluation.canEvaluate) return;

    if (evaluation.isFullyCorrect) {
      // Correct attempt resets wrong streak
      setWrongStreak(0);
      return;
    }

    // Wrong attempt increases streak; lock at 5 consecutive wrong submits
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
  };

  // Droppable wrappers
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="puzzle-container">
        <div className="puzzle-header">
          <h2><KatexRenderer latex={puzzle.title} /></h2>
          <p><strong><KatexRenderer latex={puzzle.statement} /></strong></p>

          {/* Controls */}
          <div className="puzzle-controls">
            <button
              className="control-button reset"
              onClick={handleReset}
              title="Shuffle blocks and start over"
              disabled={isChallenge && isLocked}
              style={isChallenge && isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              🔄 Reset
            </button>

            <button
              className="control-button solution"
              onClick={handleShowSolution}
              title="Show the correct solution"
              disabled={isChallenge && isLocked}
              style={isChallenge && isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              💡 Show Solution
            </button>

            {/* Challenge-only Submit */}
            {isChallenge && (
              <button
                className="control-button"
                onClick={handleSubmit}
                title="Submit to check correctness"
                disabled={isLocked}
                style={{
                  marginLeft: 8,
                  background: isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.18)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: isLocked ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.92)',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                }}
              >
                ✅ Submit
              </button>
            )}
          </div>

          {/* Challenge banner */}
          {isChallenge && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: isLocked ? '1px solid rgba(248,113,113,0.55)' : '1px solid rgba(56,189,248,0.35)',
                background: isLocked ? 'rgba(248,113,113,0.10)' : 'rgba(56,189,248,0.08)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 14,
                lineHeight: 1.35,
              }}
            >
              {isLocked ? (
                <>
                  <strong>Locked:</strong> Try again in <strong>{secondsLeft}s</strong>.
                </>
              ) : (
                <>
                  <strong>Challenge Mode:</strong> No progress shown until you press <strong>Submit</strong>.
                  <span style={{ opacity: 0.85 }}> (Consecutive wrong submits: {wrongStreak}/{MAX_CONSEC_WRONG})</span>
                </>
              )}
            </div>
          )}

          {/* Challenge results (simple percent) - only after Submit */}
          {isChallenge && revealResults && evaluation.canEvaluate && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 14,
                lineHeight: 1.35,
              }}
            >
              <strong>Result:</strong> {evaluation.percent}% correct ({evaluation.correct}/{evaluation.total} steps in correct position)
              {evaluation.missing > 0 ? ` • Missing ${evaluation.missing} step(s)` : ''}
              {evaluation.isFullyCorrect ? ' • ✅ Fully correct!' : ''}
            </div>
          )}
        </div>

        <div className="dnd-columns-container">
          <div className="puzzle-palette-container">
            <h3>Available Steps:</h3>
            <SortableContext items={availableBlocks.map(b => b.id)} strategy={verticalListSortingStrategy} id="palette">
              <PaletteDroppable>
                {availableBlocks.map(block => (
                  <ProofBlock
                    key={block.id}
                    id={block.id}
                    latexContent={block.latex}
                    isInWorkspace={false}
                    blockSelections={blockSelections[block.id] || {}}
                    onSelectionChange={handleSelectionChange}
                    disabled={isChallenge && isLocked}
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
            <SortableContext items={proofBlocks.map(b => b.id)} strategy={verticalListSortingStrategy} id="workspace">
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
                      disabled={isChallenge && isLocked}
                    />
                  </div>
                ))}
                {proofBlocks.length === 0 && (
                  <div className="empty-message">Drag steps here to build your proof</div>
                )}
              </WorkspaceDroppable>
            </SortableContext>
          </div>
        </div>

        {/* ✅ Practice: show the original % progress box
            ✅ Challenge: HIDE it completely (students shouldn't see it) */}
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
          <ProofBlock id={activeBlock.id} latexContent={activeBlock.latex} isOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PuzzleDisplay;


