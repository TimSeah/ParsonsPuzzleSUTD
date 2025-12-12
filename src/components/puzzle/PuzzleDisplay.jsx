import React, { useState, useEffect } from 'react';
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

const PuzzleDisplay = ({ puzzle, onNextPuzzle, isLastPuzzle }) => {
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [proofBlocks, setProofBlocks] = useState([]);
  const [activeId, setActiveId] = useState(null); 
  const [blockSelections, setBlockSelections] = useState({});

  useEffect(() => {
    if (puzzle && puzzle.blocks) {
      // Shuffle the blocks for the puzzle
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
      setBlockSelections({}); // Reset selections when puzzle changes
    }
  }, [puzzle]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const findContainer = (id) => {
    if (availableBlocks.find(item => item.id === id)) {
      return 'palette';
    }
    if (proofBlocks.find(item => item.id === id)) {
      return 'workspace';
    }
    return null;
  };
  
  const getBlockById = (id) => {
    return availableBlocks.find(b => b.id === id) || proofBlocks.find(b => b.id === id);
  }

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragEnd = (event) => {
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
    if (puzzle && puzzle.blocks) {
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
      setBlockSelections({}); // Reset selections
    }
  };

  const handleShowSolution = () => {
    if (puzzle && puzzle.blocks && puzzle.solutionOrder) {
      const solutionBlocks = puzzle.solutionOrder.map(id => 
        puzzle.blocks.find(block => block.id === id)
      ).filter(Boolean);
      
      setProofBlocks(solutionBlocks);
      setAvailableBlocks([]);
    }
  };

  // Define reusable droppable wrappers
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
      <div className="puzzle-container">        <div className="puzzle-header">
          <h2><KatexRenderer latex={puzzle.title} /></h2>
          <p><strong><KatexRenderer latex={puzzle.statement} /></strong></p>
          
          <div className="puzzle-controls">
            <button 
              className="control-button reset" 
              onClick={handleReset}
              title="Shuffle blocks and start over"
            >
              🔄 Reset
            </button>
            <button 
              className="control-button solution" 
              onClick={handleShowSolution}
              title="Show the correct solution"
            >
              💡 Show Solution
            </button>
          </div>
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

        {/* Validation Display */}        <ProofValidationDisplay 
          puzzle={puzzle}
          proofBlocks={proofBlocks}
          onReset={handleReset}
          onNextPuzzle={onNextPuzzle}
          isLastPuzzle={isLastPuzzle}
        />
      </div>

      {/* DragOverlay provides a smoother visual drag experience */}
      <DragOverlay dropAnimation={null}>
        {activeId && activeBlock ? (
          <ProofBlock id={activeBlock.id} latexContent={activeBlock.latex} isOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PuzzleDisplay;