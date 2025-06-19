/**
 * @fileoverview PuzzleDisplay component - Main interactive puzzle interface for Parson's Puzzles
 * 
 * This component provides the drag-and-drop interface for mathematical proof puzzles,
 * allowing users to arrange proof blocks in the correct order. It uses @dnd-kit for
 * drag and drop functionality and integrates with validation and navigation systems.
 * 
 * Features:
 * - Drag and drop proof blocks between palette and workspace
 * - Real-time proof validation
 * - Reset and show solution functionality
 * - Responsive layout with visual feedback
 * 
 * @author Parson's Puzzle SUTD Team
 */

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
import KatexRenderer from './KatexRenderer';
import './PuzzleDisplay.css';

/**
 * Main puzzle display component with drag-and-drop interface
 * 
 * @param {Object} props - Component properties
 * @param {import('../types/index.js').Puzzle} props.puzzle - Current puzzle object
 * @param {Function} props.onNextPuzzle - Callback to navigate to next puzzle
 * @param {boolean} props.isLastPuzzle - Whether this is the last puzzle in the sequence
 * @returns {JSX.Element} Rendered puzzle interface
 */
const PuzzleDisplay = ({ puzzle, onNextPuzzle, isLastPuzzle }) => {  // State for managing puzzle blocks and drag operations
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [proofBlocks, setProofBlocks] = useState([]);
  const [activeId, setActiveId] = useState(null);

  /**
   * Initialize puzzle blocks when puzzle changes
   * Shuffles available blocks and resets the workspace
   */
  useEffect(() => {
    if (puzzle && puzzle.blocks) {
      // Shuffle the blocks for the puzzle
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
    }
  }, [puzzle]);

  // Configure drag and drop sensors for both mouse and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  /**
   * Determines which container (palette or workspace) contains a given block ID
   * @param {string} id - The block ID to search for
   * @returns {string|null} Container name ('palette' or 'workspace') or null if not found
   */
  const findContainer = (id) => {
    if (availableBlocks.find(item => item.id === id)) {
      return 'palette';
    }
    if (proofBlocks.find(item => item.id === id)) {
      return 'workspace';
    }
    return null;
  };
  
  /**
   * Retrieves a block object by its ID from either container
   * @param {string} id - The block ID to find
   * @returns {Object|undefined} The block object or undefined if not found
   */
  const getBlockById = (id) => {
    return availableBlocks.find(b => b.id === id) || proofBlocks.find(b => b.id === id);
  };

  /**
   * Handles the start of a drag operation
   * @param {Object} event - Drag start event from @dnd-kit
   */
  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  /**
   * Handles the end of a drag operation, managing block movement between containers
   * @param {Object} event - Drag end event from @dnd-kit
   */
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
        });      }
    }
  };

  /**
   * Resets the puzzle to its initial state with shuffled blocks
   */
  const handleReset = () => {
    if (puzzle && puzzle.blocks) {
      const shuffledBlocks = [...puzzle.blocks].sort(() => Math.random() - 0.5);
      setAvailableBlocks(shuffledBlocks);
      setProofBlocks([]);
    }
  };

  /**
   * Shows the correct solution by arranging blocks in the proper order
   */
  const handleShowSolution = () => {
    if (puzzle && puzzle.blocks && puzzle.solutionOrder) {
      const solutionBlocks = puzzle.solutionOrder.map(id => 
        puzzle.blocks.find(block => block.id === id)
      ).filter(Boolean);
      
      setProofBlocks(solutionBlocks);
      setAvailableBlocks([]);
    }
  };

  /**
   * Droppable container for the palette (available blocks)
   * @param {Object} props - Component props
   * @param {React.ReactNode} props.children - Child components to render
   * @returns {JSX.Element} Droppable palette container
   */
  const PaletteDroppable = ({ children }) => {
    const { setNodeRef } = useDroppable({ id: 'palette' });
    return (
      <div ref={setNodeRef} className="puzzle-palette droppable-area">
        {children}
      </div>
    );
  };

  /**
   * Droppable container for the workspace (proof construction area)
   * @param {Object} props - Component props
   * @param {React.ReactNode} props.children - Child components to render
   * @returns {JSX.Element} Droppable workspace container
   */
  const WorkspaceDroppable = ({ children }) => {
    const { setNodeRef } = useDroppable({ id: 'workspace' });
    return (
      <div ref={setNodeRef} className="puzzle-workspace droppable-area">
        {children}
      </div>
    );
  };    
  // Get the currently dragged block for overlay display
  const activeBlock = activeId ? getBlockById(activeId) : null;

  // Show loading state if puzzle is not available
  if (!puzzle) {
    return <div className="loading-message">Loading puzzle...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="puzzle-container">
        {/* Puzzle Header with title, statement, and controls */}
        <div className="puzzle-header">
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

        {/* Main drag-and-drop interface */}
        <div className="dnd-columns-container">
          {/* Available blocks palette */}
          <div className="puzzle-palette-container">
            <h3>Available Steps:</h3>
            <SortableContext items={availableBlocks.map(b => b.id)} strategy={verticalListSortingStrategy} id="palette">
              <PaletteDroppable>
                {availableBlocks.map(block => (
                  <ProofBlock key={block.id} id={block.id} latexContent={block.latex} />
                ))}
                {availableBlocks.length === 0 && (
                  <div className="empty-message">All blocks are in use</div>
                )}
              </PaletteDroppable>
            </SortableContext>
          </div>

          {/* Proof construction workspace */}
          <div className="puzzle-workspace-container">
            <h3>Your Proof:</h3>
            <SortableContext items={proofBlocks.map(b => b.id)} strategy={verticalListSortingStrategy} id="workspace">
              <WorkspaceDroppable>
                {proofBlocks.map((block, index) => (
                  <div key={block.id} className="proof-step">
                    <span className="step-number">{index + 1}.</span>
                    <ProofBlock id={block.id} latexContent={block.latex} />
                  </div>
                ))}
                {proofBlocks.length === 0 && (
                  <div className="empty-message">Drag steps here to build your proof</div>
                )}
              </WorkspaceDroppable>
            </SortableContext>
          </div>
        </div>

        {/* Validation and Navigation */}
        <ProofValidationDisplay 
          puzzle={puzzle}
          proofBlocks={proofBlocks}
          onReset={handleReset}
          onNextPuzzle={onNextPuzzle}
          isLastPuzzle={isLastPuzzle}
        />
      </div>

      {/* Drag overlay for smooth visual feedback during drag operations */}
      <DragOverlay dropAnimation={null}>
        {activeId && activeBlock ? (
          <ProofBlock id={activeBlock.id} latexContent={activeBlock.latex} isOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PuzzleDisplay;