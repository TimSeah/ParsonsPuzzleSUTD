import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical, Plus, X } from 'lucide-react';
import { KatexRenderer } from '../renderers';
import './ProofBlock.css';

// Keep taps on the action buttons from starting a drag of the whole block.
const stopDragStart = {
  onPointerDown: (event) => event.stopPropagation(),
  onMouseDown: (event) => event.stopPropagation(),
  onTouchStart: (event) => event.stopPropagation(),
  onKeyDown: (event) => event.stopPropagation(),
};

const addLearnerFriendlyTransition = (content, role) => {
  const text = String(content || '').trim();
  if (!text) return text;

  // Only model-generated blocks carry a pedagogical role; bundled and
  // educator puzzles are rendered exactly as authored.
  if (!role) return text;

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

const ProofBlock = ({
  id,
  latexContent,
  pedagogicalRole = '',
  isOverlay = false,
  isInWorkspace = false,
  blockSelections = {},
  onSelectionChange,
  disabled = false,
  stepNumber,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleVariableChange = (varType, value) => {
    if (onSelectionChange) onSelectionChange(id, varType, value);
  };

  // Symbols can be changed in either column, but not mid-drag or while the
  // puzzle is locked.
  const isInteractive = !isOverlay && !isDragging && !disabled;
  const content = addLearnerFriendlyTransition(latexContent, pedagogicalRole);
  const hasActions = !isOverlay && (onAdd || onRemove || onMoveUp || onMoveDown);
  const stepLabel = stepNumber ? `step ${stepNumber}` : 'step';

  // Keyboard dragging and the drag role live on the grip handle so the action
  // buttons aren't nested inside another interactive element. Mouse and touch
  // can still start a drag from anywhere on the step's text.
  const pointerListeners = listeners
    ? { onMouseDown: listeners.onMouseDown, onTouchStart: listeners.onTouchStart }
    : {};

  const className = [
    'proof-block',
    isInWorkspace && 'proof-block--placed',
    isDragging && 'proof-block--dragging',
    isOverlay && 'proof-block--overlay',
    disabled && 'proof-block--disabled',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      data-id={id}
    >
      {!isOverlay && (
        <span
          ref={setActivatorNodeRef}
          className="proof-block__grip"
          {...attributes}
          {...listeners}
          aria-label={`Drag ${stepLabel}`}
          title="Drag to move"
        >
          <GripVertical size={16} aria-hidden="true" />
        </span>
      )}

      {stepNumber && <span className="proof-block__number" aria-hidden="true">{stepNumber}</span>}

      <div className="proof-block__content" {...pointerListeners}>
        <KatexRenderer
          latex={content}
          variables={blockSelections}
          onVariableChange={handleVariableChange}
          isInteractive={isInteractive}
          blockId={id}
        />
      </div>

      {hasActions && (
        <div className="proof-block__actions" {...stopDragStart}>
          {onAdd && (
            <button type="button" className="icon-btn proof-block__action proof-block__action--add" onClick={onAdd} disabled={disabled} aria-label="Add to proof" title="Add to proof">
              <Plus size={18} aria-hidden="true" />
            </button>
          )}
          {onMoveUp && (
            <button type="button" className="icon-btn proof-block__action" onClick={onMoveUp} disabled={disabled || !canMoveUp} aria-label={`Move ${stepLabel} up`} title="Move up">
              <ArrowUp size={16} aria-hidden="true" />
            </button>
          )}
          {onMoveDown && (
            <button type="button" className="icon-btn proof-block__action" onClick={onMoveDown} disabled={disabled || !canMoveDown} aria-label={`Move ${stepLabel} down`} title="Move down">
              <ArrowDown size={16} aria-hidden="true" />
            </button>
          )}
          {onRemove && (
            <button type="button" className="icon-btn proof-block__action" onClick={onRemove} disabled={disabled} aria-label={`Remove ${stepLabel} from proof`} title="Remove from proof">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProofBlock;
