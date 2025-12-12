import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KatexRenderer } from '../renderers';
import './ProofBlock.css';

const ProofBlock = ({
  id,
  latexContent,
  isOverlay,
  isInWorkspace,
  blockSelections = {},
  onSelectionChange
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.25)' : '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: isDragging || isOverlay ? 100 : 'auto',
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.8 : 1,
  };

  const handleVariableChange = (varType, value) => {
    if (onSelectionChange) {
      onSelectionChange(id, varType, value);
    }
  };

  const isInteractive = !isOverlay && !isDragging && !isInWorkspace;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="proof-block"
      data-id={id}
    >
      <KatexRenderer 
        latex={latexContent} 
        variables={blockSelections} 
        onVariableChange={handleVariableChange}
        isInteractive={isInteractive}
        blockId={id}
      />
    </div>
  );
};

export default ProofBlock;