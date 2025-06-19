/**
 * @fileoverview ProofBlock component - Individual draggable proof step blocks
 * 
 * This component represents a single mathematical proof step that can be dragged
 * and dropped within the puzzle interface. It uses @dnd-kit for drag functionality
 * and KaTeX for mathematical notation rendering.
 * 
 * Features:
 * - Drag and drop functionality with visual feedback
 * - Mathematical notation rendering via KaTeX
 * - Responsive styling with hover and drag states
 * - Overlay support for smooth drag previews
 * 
 * @author Parson's Puzzle SUTD Team
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KatexRenderer from './KatexRenderer';
import './ProofBlock.css';

/**
 * A draggable proof block component representing a single step in a mathematical proof
 * 
 * @param {Object} props - Component properties
 * @param {string} props.id - Unique identifier for the block (required for drag and drop)
 * @param {string} props.latexContent - LaTeX mathematical content to render
 * @param {boolean} [props.isOverlay=false] - Whether this block is being used as a drag overlay
 * @returns {JSX.Element} Rendered proof block
 */
const ProofBlock = ({ id, latexContent, isOverlay = false }) => {
  // Get drag and drop properties from @dnd-kit
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  // Dynamic styling based on drag state
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Enhanced visual feedback during drag operations
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.25)' : '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: isDragging || isOverlay ? 100 : 'auto', // Ensure dragging item appears on top
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`proof-block ${isOverlay ? 'proof-block--overlay' : ''}`}
      data-id={id}
      title={`Proof step: ${id}`} // Accessibility tooltip
    >
      <KatexRenderer latex={latexContent} />
    </div>
  );
};

export default ProofBlock;