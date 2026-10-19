import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KatexRenderer } from '../renderers';
import { LoadingState, ErrorTooltip } from '../ui';
import CustomTagInput from './CustomTagInput';
import styles from './PuzzleCreator.module.css';

// Available categories based on existing JSON files
const CATEGORIES = {
  'big-o': {
    name: 'Big O Notation',
    description: 'Proofs involving Big O, Omega, and Theta notation',
    file: 'big-o-proofs.json',
    suggestedTags: ['big-o', 'omega', 'theta', 'asymptotic-analysis', 'logarithm', 'polynomial', 'exponential', 'proof-by-contradiction', 'negation']
  },
  'induction': {
    name: 'Mathematical Induction',
    description: 'Proofs using mathematical induction',
    file: 'induction-proofs.json',
    suggestedTags: ['induction', 'summation', 'arithmetic-series', 'geometric-series', 'powers', 'divisibility', 'modular-arithmetic']
  },
  'recursion': {
    name: 'Recursion',
    description: 'Proofs involving recursive relations and algorithms',
    file: 'recursion-proofs.json',
    suggestedTags: ['recursion', 'fibonacci', 'sequences', 'towers-of-hanoi', 'algorithms', 'recurrence-relations']
  },
  'set-theory': {
    name: 'Set Theory',
    description: 'Proofs involving set operations and properties',
    file: 'set-theory-proofs.json',
    suggestedTags: ['set-theory', 'distributive-law', 'de-morgan-law', 'intersection', 'union', 'complement']
  }
};

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// Sortable Block Item Component
function SortableBlockItem({ block, index, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles['block-item']} ${isDragging ? styles['dragging'] : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={styles['drag-handle']}
      >
        ⋮⋮
      </div>
      <div className={styles['block-content']}>
        <div className={styles['block-number']}>
          Step {index + 1}:
        </div>
        <KatexRenderer latex={block.latex} />
      </div>
      <button
        className={styles['remove-block']}
        onClick={() => onRemove(block.id)}
      >
        🗑
      </button>
    </div>
  );
}

function PuzzleCreator({ onSave, onCancel, initialPuzzle = null }) {
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

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate unique ID for blocks
  const generateBlockId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    return `block-${timestamp}-${random}`;
  }, []);

  // Add a new block
  const addBlock = useCallback(() => {
    if (!currentBlock.trim()) return;

    const newBlock = {
      id: generateBlockId(),
      latex: currentBlock.trim()
    };

    setPuzzleData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));

    setCurrentBlock('');
  }, [currentBlock, generateBlockId]);

  // Remove a block
  const removeBlock = useCallback((blockId) => {
    setPuzzleData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    }));
  }, []);

  // Handle drag end for reordering blocks
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPuzzleData(prev => {
        const oldIndex = prev.blocks.findIndex(block => block.id === active.id);
        const newIndex = prev.blocks.findIndex(block => block.id === over.id);

        return {
          ...prev,
          blocks: arrayMove(prev.blocks, oldIndex, newIndex)
        };
      });
    }
  }, []);

  // Toggle tag selection
  const toggleTag = useCallback((tag) => {
    setPuzzleData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  }, []);

  // Add custom tag (for future implementation)
  const addCustomTag = useCallback((tag) => {
    if (tag && !puzzleData.tags.includes(tag)) {
      setPuzzleData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  }, [puzzleData.tags]);

  // Validate puzzle data
  const validatePuzzle = useCallback(() => {
    const newErrors = {};

    if (!puzzleData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!puzzleData.displayTitle.trim()) {
      newErrors.displayTitle = 'Display title is required';
    }

    if (!puzzleData.statement.trim()) {
      newErrors.statement = 'Statement is required';
    }

    if (puzzleData.blocks.length < 2) {
      newErrors.blocks = 'At least 2 blocks are required';
    }

    if (puzzleData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [puzzleData]);

  // Save puzzle
  const handleSave = useCallback(async () => {
    if (!validatePuzzle()) return;

    setIsSaving(true);
    
    try {
      // Generate puzzle ID
      const puzzleId = `puzzle-${Date.now()}`;
      
      // Create the complete puzzle object
      const completePuzzle = {
        id: puzzleId,
        ...puzzleData,
        solutionOrder: puzzleData.blocks.map(block => block.id)
      };

      await onSave(completePuzzle);
    } catch (error) {
      console.error('Error saving puzzle:', error);
      setErrors({ save: 'Failed to save puzzle. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [puzzleData, validatePuzzle, onSave]);

  const selectedCategory = CATEGORIES[puzzleData.category];

  return (
    <div className={styles['puzzle-creator']}>
      <div className={styles['creator-header']}>
        <h2>🎯 Create New Puzzle</h2>
        <div className={styles['header-actions']}>
          <button 
            className={styles['preview-toggle']}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? '📝 Edit' : '👁 Preview'}
          </button>
        </div>
      </div>

      {!isPreviewMode ? (
        <div className={styles['creator-content']}>
          {/* Basic Information */}
          <div className={styles['section']}>
            <h3>📋 Basic Information</h3>
            
            <div className={styles['form-group']}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={puzzleData.category}
                onChange={(e) => setPuzzleData(prev => ({ ...prev, category: e.target.value }))}
              >
                {Object.entries(CATEGORIES).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.name}</option>
                ))}
              </select>
              <span className={styles['category-desc']}>{selectedCategory.description}</span>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="title">LaTeX Title</label>
              <textarea
                id="title"
                value={puzzleData.title}
                onChange={(e) => setPuzzleData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., \\text{Prove } n^2 + n^3 = \\Theta(n^3)"
                className={errors.title ? styles['error'] : ''}
              />
              {errors.title && <ErrorTooltip message={errors.title} />}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="displayTitle">Display Title (Plain Text)</label>
              <input
                type="text"
                id="displayTitle"
                value={puzzleData.displayTitle}
                onChange={(e) => setPuzzleData(prev => ({ ...prev, displayTitle: e.target.value }))}
                placeholder="e.g., Prove n² + n³ = Θ(n³)"
                className={errors.displayTitle ? styles['error'] : ''}
              />
              {errors.displayTitle && <ErrorTooltip message={errors.displayTitle} />}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="statement">Statement (LaTeX)</label>
              <textarea
                id="statement"
                value={puzzleData.statement}
                onChange={(e) => setPuzzleData(prev => ({ ...prev, statement: e.target.value }))}
                placeholder="e.g., n^2 + n^3 = \\Theta(n^3)"
                className={errors.statement ? styles['error'] : ''}
              />
              {errors.statement && <ErrorTooltip message={errors.statement} />}
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                value={puzzleData.difficulty}
                onChange={(e) => setPuzzleData(prev => ({ ...prev, difficulty: e.target.value }))}
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags Section */}
          <div className={styles['section']}>
            <h3>🏷 Tags</h3>
            <div className={styles['tags-container']}>
              <div className={styles['suggested-tags']}>
                <h4>Suggested Tags for {selectedCategory.name}:</h4>
                <div className={styles['tag-grid']}>
                  {selectedCategory.suggestedTags.map(tag => (
                    <button
                      key={tag}
                      className={`${styles['tag-button']} ${
                        puzzleData.tags.includes(tag) ? styles['selected'] : ''
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles['custom-tags']}>
                <h4>Selected Tags:</h4>
                <div className={styles['selected-tags']}>
                  {puzzleData.tags.map(tag => (
                    <span key={tag} className={styles['selected-tag']}>
                      {tag}
                      <button onClick={() => toggleTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
                {errors.tags && <ErrorTooltip message={errors.tags} />}

                <CustomTagInput
                  onAddTag={addCustomTag}
                  existingTags={puzzleData.tags}
                />
              </div>
            </div>
          </div>

          {/* Blocks Section */}
          <div className={styles['section']}>
            <h3>🧩 Proof Blocks</h3>
            
            <div className={styles['block-input']}>
              <label htmlFor="currentBlock">Add New Block (LaTeX)</label>
              <textarea
                id="currentBlock"
                value={currentBlock}
                onChange={(e) => setCurrentBlock(e.target.value)}
                placeholder="Enter LaTeX for the proof step..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    addBlock();
                  }
                }}
              />
              <div className={styles['block-preview']}>
                {currentBlock && (
                  <div className={styles['preview-label']}>Preview:</div>
                )}
                <KatexRenderer latex={currentBlock} />
              </div>
              <button
                onClick={addBlock}
                disabled={!currentBlock.trim()}
                className={styles['add-block-btn']}
              >
                ➕ Add Block (Ctrl+Enter)
              </button>
            </div>

            {/* Blocks List - Drag and Drop */}
            <div className={styles['blocks-list']}>
              <h4>Proof Steps (Drag to Reorder):</h4>
              {puzzleData.blocks.length === 0 ? (
                <div className={styles['empty-blocks']}>
                  No blocks added yet. Add blocks above to build your proof.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={puzzleData.blocks.map(block => block.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className={styles['draggable-list']}>
                      {puzzleData.blocks.map((block, index) => (
                        <SortableBlockItem
                          key={block.id}
                          block={block}
                          index={index}
                          onRemove={removeBlock}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              {errors.blocks && <ErrorTooltip message={errors.blocks} />}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles['preview-content']}>
          <h3>🔍 Puzzle Preview</h3>
          <div className={styles['preview-puzzle']}>
            <div className={styles['puzzle-header']}>
              <h4><KatexRenderer latex={puzzleData.title} /></h4>
              <div className={styles['puzzle-meta']}>
                <span className={styles['difficulty']}>{puzzleData.difficulty}</span>
                <span className={styles['category']}>{selectedCategory.name}</span>
              </div>
            </div>
            <div className={styles['puzzle-statement']}>
              <KatexRenderer latex={puzzleData.statement} />
            </div>
            <div className={styles['puzzle-tags']}>
              {puzzleData.tags.map(tag => (
                <span key={tag} className={styles['tag']}>{tag}</span>
              ))}
            </div>
            <div className={styles['puzzle-blocks']}>
              <h5>Proof Steps ({puzzleData.blocks.length}):</h5>
              {puzzleData.blocks.map((block, index) => (
                <div key={block.id} className={styles['preview-block']}>
                  <span className={styles['step-num']}>#{index + 1}</span>
                  <KatexRenderer latex={block.latex} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles['creator-actions']}>
        {errors.save && <ErrorTooltip message={errors.save} />}
        <button
          className={styles['cancel-btn']}
          onClick={onCancel}
          disabled={isSaving}
        >
          ❌ Cancel
        </button>
        <button
          className={styles['save-btn']}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <LoadingState size="small" /> : '🚀 Publish Puzzle'}
        </button>
      </div>
    </div>
  );
}

export default PuzzleCreator;
