import { useCallback, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, GripVertical, Plus, Send, Trash2, X } from 'lucide-react';
import { KatexRenderer } from '../renderers';
import { LoadingState } from '../ui';
import PuzzleDisplay from '../puzzle/PuzzleDisplay';
import CustomTagInput from './CustomTagInput';
import { CATEGORIES } from './educatorCategories';
import { placeholderProblems } from '../../utils/placeholders';
import styles from './PuzzleCreator.module.css';

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="field__error">
      <AlertCircle size={14} aria-hidden="true" /> {message}
    </p>
  );
}

function LatexPreview({ latex }) {
  if (!latex.trim()) return null;
  return (
    <div className={styles.preview} aria-label="Preview">
      <span className={styles.previewLabel}>Preview</span>
      <KatexRenderer latex={latex} revealAnswers />
    </div>
  );
}

function SortableBlockItem({ block, index, total, onRemove, onMove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const step = `step ${index + 1}`;
  const upRef = useRef(null);
  const downRef = useRef(null);

  // A button that becomes disabled at the top/bottom drops focus; move it to the other arrow.
  const move = (delta) => {
    flushSync(() => onMove(index, delta));
    const pressed = delta < 0 ? upRef.current : downRef.current;
    if (pressed?.disabled) (delta < 0 ? downRef.current : upRef.current)?.focus();
  };

  return (
    <li ref={setNodeRef} style={style} className={`${styles.block} ${isDragging ? styles.blockDragging : ''}`}>
      <span ref={setActivatorNodeRef} className={styles.grip} {...attributes} {...listeners} aria-label={`Drag ${step}`}>
        <GripVertical size={16} aria-hidden="true" />
      </span>
      <span className={styles.blockNumber} aria-hidden="true">{index + 1}</span>
      <div className={styles.blockContent}><KatexRenderer latex={block.latex} revealAnswers /></div>
      <div className={styles.blockActions}>
        <button ref={upRef} type="button" className="icon-btn" onClick={() => move(-1)} disabled={index === 0} aria-label={`Move ${step} up`}>
          <ArrowUp size={16} aria-hidden="true" />
        </button>
        <button ref={downRef} type="button" className="icon-btn" onClick={() => move(1)} disabled={index === total - 1} aria-label={`Move ${step} down`}>
          <ArrowDown size={16} aria-hidden="true" />
        </button>
        <button type="button" className="icon-btn btn--danger" data-delete-step onClick={() => onRemove(block.id)} aria-label={`Delete ${step}`}>
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function PuzzleCreator({ onSave, onCancel, initialPuzzle = null }) {
  const idPrefix = useId();
  const fieldId = (name) => `${idPrefix}-${name}`;

  const [puzzleData, setPuzzleData] = useState({
    category: initialPuzzle?.category || 'big-o',
    title: initialPuzzle?.title || '',
    displayTitle: initialPuzzle?.displayTitle || '',
    statement: initialPuzzle?.statement || '',
    difficulty: initialPuzzle?.difficulty || 'medium',
    tags: initialPuzzle?.tags || [],
    blocks: initialPuzzle?.blocks || []
  });

  const [currentBlock, setCurrentBlock] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const blockListRef = useRef(null);
  const newStepRef = useRef(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const update = (field) => (event) => {
    const { value } = event.target;
    setPuzzleData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Generate unique ID for blocks
  const generateBlockId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `block-${timestamp}-${random}`;
  }, []);

  const addBlock = useCallback(() => {
    if (!currentBlock.trim()) return;
    const newBlock = { id: generateBlockId(), latex: currentBlock.trim() };
    setPuzzleData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    setErrors(prev => ({ ...prev, blocks: undefined }));
    setCurrentBlock('');
  }, [currentBlock, generateBlockId]);

  // Deleting unmounts the focused button, so focus the next (or previous) step's delete button,
  // or the new-step box once the list is empty.
  const removeBlock = useCallback((blockId) => {
    const index = puzzleData.blocks.findIndex(block => block.id === blockId);
    flushSync(() => {
      setPuzzleData(prev => ({ ...prev, blocks: prev.blocks.filter(block => block.id !== blockId) }));
    });
    const remaining = blockListRef.current?.querySelectorAll('[data-delete-step]') || [];
    const target = remaining[Math.min(index, remaining.length - 1)] || newStepRef.current;
    target?.focus();
  }, [puzzleData.blocks]);

  const moveBlock = useCallback((index, delta) => {
    setPuzzleData(prev => {
      const target = index + delta;
      if (target < 0 || target >= prev.blocks.length) return prev;
      return { ...prev, blocks: arrayMove(prev.blocks, index, target) };
    });
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPuzzleData(prev => {
      const oldIndex = prev.blocks.findIndex(block => block.id === active.id);
      const newIndex = prev.blocks.findIndex(block => block.id === over.id);
      return { ...prev, blocks: arrayMove(prev.blocks, oldIndex, newIndex) };
    });
  }, []);

  const toggleTag = useCallback((tag) => {
    setPuzzleData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
    }));
    setErrors(prev => ({ ...prev, tags: undefined }));
  }, []);

  const addCustomTag = useCallback((tag) => {
    if (!tag) return;
    setPuzzleData(prev => (prev.tags.includes(tag) ? prev : { ...prev, tags: [...prev.tags, tag] }));
    setErrors(prev => ({ ...prev, tags: undefined }));
  }, []);

  const validatePuzzle = useCallback(() => {
    const newErrors = {};
    if (!puzzleData.title.trim()) newErrors.title = 'Title is required';
    if (!puzzleData.displayTitle.trim()) newErrors.displayTitle = 'Display title is required';
    if (!puzzleData.statement.trim()) newErrors.statement = 'Statement is required';
    if (puzzleData.blocks.length < 2) {
      newErrors.blocks = 'Add at least 2 proof steps';
    } else {
      const stepWithProblem = puzzleData.blocks.findIndex(block => placeholderProblems(block.latex).length > 0);
      if (stepWithProblem >= 0) {
        newErrors.blocks = `Step ${stepWithProblem + 1}: ${placeholderProblems(puzzleData.blocks[stepWithProblem].latex)[0]}`;
      }
    }
    if (puzzleData.tags.length === 0) newErrors.tags = 'At least one tag is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [puzzleData]);

  const handleSave = useCallback(async () => {
    if (!validatePuzzle()) {
      setIsPreviewMode(false);
      return;
    }

    setIsSaving(true);
    try {
      const completePuzzle = {
        id: `puzzle-${Date.now()}`,
        ...puzzleData,
        solutionOrder: puzzleData.blocks.map(block => block.id)
      };
      await onSave(completePuzzle);
    } catch (error) {
      console.error('Error saving puzzle:', error);
      setErrors({ save: error?.message || 'Failed to save puzzle. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [puzzleData, validatePuzzle, onSave]);

  const selectedCategory = CATEGORIES[puzzleData.category];
  const errorCount = Object.entries(errors).filter(([key, value]) => key !== 'save' && value).length;
  const invalidProps = (name) => (errors[name]
    ? { 'aria-invalid': true, 'aria-describedby': fieldId(`${name}-error`) }
    : {});

  const previewPuzzle = {
    id: 'educator-preview',
    title: puzzleData.title || puzzleData.displayTitle || '\\text{Untitled puzzle}',
    statement: puzzleData.statement,
    blocks: puzzleData.blocks,
    solutionOrder: puzzleData.blocks.map(block => block.id),
  };

  return (
    <div className={styles.creator}>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
            <ArrowLeft size={16} aria-hidden="true" /> Dashboard
          </button>
          <h1 className={`page-title ${styles.title}`}>Create a puzzle</h1>
        </div>
        <div className="segmented" role="radiogroup" aria-label="View">
          <button type="button" role="radio" aria-checked={!isPreviewMode} className="segmented__option" onClick={() => setIsPreviewMode(false)}>
            Edit
          </button>
          <button type="button" role="radio" aria-checked={isPreviewMode} className="segmented__option" onClick={() => setIsPreviewMode(true)}>
            Preview
          </button>
        </div>
      </div>

      {errorCount > 0 && (
        <div className="notice notice--danger" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>Please fix {errorCount === 1 ? 'the highlighted field' : `the ${errorCount} highlighted fields`} before publishing.</span>
        </div>
      )}

      {!isPreviewMode ? (
        <div className={styles.sections}>
          <section className="card" aria-labelledby={fieldId('details-heading')}>
            <h2 id={fieldId('details-heading')} className="card-title">Details</h2>
            <div className={styles.grid}>
              <div className="field">
                <label className="field__label" htmlFor={fieldId('category')}>Category</label>
                <select id={fieldId('category')} className="input" value={puzzleData.category} onChange={update('category')}>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.name}</option>
                  ))}
                </select>
                <span className="field__hint">{selectedCategory.description}</span>
              </div>

              <div className="field">
                <span className="field__label" id={fieldId('difficulty')}>Difficulty</span>
                <div className="segmented segmented--block" role="radiogroup" aria-labelledby={fieldId('difficulty')}>
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      role="radio"
                      aria-checked={puzzleData.difficulty === level}
                      className="segmented__option"
                      onClick={() => setPuzzleData(prev => ({ ...prev, difficulty: level }))}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor={fieldId('title')}>Title (LaTeX)</label>
              <textarea
                id={fieldId('title')}
                className="input input--mono"
                rows={2}
                value={puzzleData.title}
                onChange={update('title')}
                placeholder="e.g. \text{Prove } n^2 + n^3 = \Theta(n^3)"
                {...invalidProps('title')}
              />
              <FieldError id={fieldId('title-error')} message={errors.title} />
              <LatexPreview latex={puzzleData.title} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor={fieldId('displayTitle')}>Display title (plain text)</label>
              <input
                type="text"
                id={fieldId('displayTitle')}
                className="input"
                value={puzzleData.displayTitle}
                onChange={update('displayTitle')}
                placeholder="e.g. Prove n² + n³ = Θ(n³)"
                {...invalidProps('displayTitle')}
              />
              <span className="field__hint">Shown in lists and exports where LaTeX isn&apos;t rendered.</span>
              <FieldError id={fieldId('displayTitle-error')} message={errors.displayTitle} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor={fieldId('statement')}>Statement (LaTeX)</label>
              <textarea
                id={fieldId('statement')}
                className="input input--mono"
                rows={2}
                value={puzzleData.statement}
                onChange={update('statement')}
                placeholder="e.g. n^2 + n^3 = \Theta(n^3)"
                {...invalidProps('statement')}
              />
              <FieldError id={fieldId('statement-error')} message={errors.statement} />
              <LatexPreview latex={puzzleData.statement} />
            </div>
          </section>

          <section className="card" aria-labelledby={fieldId('tags-heading')}>
            <h2 id={fieldId('tags-heading')} className="card-title">Tags</h2>
            <div className="field">
              <span className="field__label" id={fieldId('suggested')}>Suggested for {selectedCategory.name}</span>
              <div className={styles.chips} role="group" aria-labelledby={fieldId('suggested')}>
                {selectedCategory.suggestedTags.map(tag => (
                  <button key={tag} type="button" className="chip" aria-pressed={puzzleData.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="field__label" id={fieldId('selected')}>Selected tags</span>
              {puzzleData.tags.length > 0 ? (
                <ul className={styles.selectedTags} aria-labelledby={fieldId('selected')}>
                  {puzzleData.tags.map(tag => (
                    <li key={tag} className="badge">
                      {tag}
                      <button type="button" className={styles.removeTag} onClick={() => toggleTag(tag)} aria-label={`Remove tag ${tag}`}>
                        <X size={12} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="field__hint">No tags selected yet.</span>
              )}
              <FieldError id={fieldId('tags-error')} message={errors.tags} />
            </div>

            <CustomTagInput onAddTag={addCustomTag} existingTags={puzzleData.tags} />
          </section>

          <section className="card" aria-labelledby={fieldId('blocks-heading')}>
            <h2 id={fieldId('blocks-heading')} className="card-title">Proof steps</h2>
            <p className="field__hint">Add the steps in the correct order. Students receive them shuffled.</p>
            <p className="field__hint">
              To make students pick a symbol, write a placeholder with its answer, for example <code>{'{{op:\\leq}}'}</code> or <code>{'{{complexity:\\Theta}}'}</code>. Students click it to cycle through the symbols.
            </p>

            <div className="field">
              <label className="field__label" htmlFor={fieldId('currentBlock')}>New step (LaTeX)</label>
              <textarea
                ref={newStepRef}
                id={fieldId('currentBlock')}
                className="input input--mono"
                rows={2}
                value={currentBlock}
                onChange={(e) => setCurrentBlock(e.target.value)}
                placeholder="e.g. \text{Base case: } n = 1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    addBlock();
                  }
                }}
              />
              <LatexPreview latex={currentBlock} />
              {[...new Set(placeholderProblems(currentBlock))].map(problem => (
                <p key={problem} className="field__error">
                  <AlertCircle size={14} aria-hidden="true" /> {problem}
                </p>
              ))}
              <div>
                <button type="button" className="btn btn--sm" onClick={addBlock} disabled={!currentBlock.trim()}>
                  <Plus size={16} aria-hidden="true" /> Add step <kbd className={styles.kbd}>Ctrl+Enter</kbd>
                </button>
              </div>
            </div>

            {puzzleData.blocks.length === 0 ? (
              <p className={styles.emptyBlocks}>No steps yet. Add the first step of the proof above.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={puzzleData.blocks.map(block => block.id)} strategy={verticalListSortingStrategy}>
                  <ol ref={blockListRef} className={styles.blockList} aria-label="Proof steps in order">
                    {puzzleData.blocks.map((block, index) => (
                      <SortableBlockItem
                        key={block.id}
                        block={block}
                        index={index}
                        total={puzzleData.blocks.length}
                        onRemove={removeBlock}
                        onMove={moveBlock}
                      />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
            )}
            <FieldError id={fieldId('blocks-error')} message={errors.blocks} />
          </section>
        </div>
      ) : (
        <div className={styles.sections}>
          <div className="cluster">
            <span className="badge">{selectedCategory.name}</span>
            <span className="badge">{puzzleData.difficulty}</span>
            {puzzleData.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
          </div>
          <p className="field__hint">This is how students will see the puzzle. Try solving it to check the steps.</p>
          {puzzleData.blocks.length > 0 ? (
            <PuzzleDisplay key={previewPuzzle.solutionOrder.join('|')} puzzle={previewPuzzle} isLastPuzzle mode="practice" />
          ) : (
            <p className={styles.emptyBlocks}>Add proof steps to preview the puzzle.</p>
          )}
        </div>
      )}

      <div className={styles.footer}>
        {errors.save && (
          <div className="notice notice--danger" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errors.save}</span>
          </div>
        )}
        <div className={styles.footerActions}>
          <button type="button" className="btn" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button type="button" className="btn btn--success" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><LoadingState size="small" title="Publishing" /> Publishing…</> : <><Send size={16} aria-hidden="true" /> Publish puzzle</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PuzzleCreator;
