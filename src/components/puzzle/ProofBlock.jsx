import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KatexRenderer } from '../renderers';
import './ProofBlock.css';

const ProofBlock = ({
  id,
  latexContent,
  pedagogicalRole = '',
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

  const addLearnerFriendlyTransition = (content, role) => {
    const text = String(content || '').trim();
    if (!text) return text;

    // Preserve complete KaTeX expressions that already contain their own
    // learner-facing wording, e.g. \text{Consider the case } ... . Prefixing
    // these would turn a valid expression into raw, unparseable text.
    if (/^\\(?:text|boxed|begin|underbrace|overbrace)(?:\{|\b)/.test(text)) {
      return text;
    }

    // Preserve explanations already supplied by the puzzle author or model.
    if (/^(?:assume|suppose|let|fix|take|from|by|since|therefore|thus|hence|using|apply|combining|consider|we|it follows|conclude|obtain|have)\b/i.test(text)) {
      return text;
    }

    const normalizedRole = String(role || '').toLowerCase();
    if (/assum|premise|hypothesis/.test(normalizedRole)) return `Assume ${text}`;
    if (/case|split/.test(normalizedRole)) return `Consider the case ${text}`;
    if (/elimin|extract|destruct/.test(normalizedRole)) return `From the previous result, derive ${text}`;
    if (/contradict|false/.test(normalizedRole)) return `This gives a contradiction: ${text}`;
    if (/conclu|final/.test(normalizedRole)) return `Therefore, conclude ${text}`;
    if (/introduc|construct|combine/.test(normalizedRole)) return `Therefore, obtain ${text}`;
    return `Therefore, ${text}`;
  };

  const learnerFriendlyContent = addLearnerFriendlyTransition(latexContent, pedagogicalRole);

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
        latex={learnerFriendlyContent}
        variables={blockSelections} 
        onVariableChange={handleVariableChange}
        isInteractive={isInteractive}
        blockId={id}
      />
    </div>
  );
};

export default ProofBlock;
