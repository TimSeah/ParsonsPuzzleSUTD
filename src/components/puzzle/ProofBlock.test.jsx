import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import ProofBlock from './ProofBlock.jsx';
import { visibleText } from '../../test/helpers.js';

function renderBlock(props) {
  const { container } = render(
    <DndContext>
      <SortableContext items={[props.id]}>
        <ProofBlock {...props} />
      </SortableContext>
    </DndContext>,
  );
  return container.querySelector('.proof-block');
}

describe('ProofBlock', () => {
  it('renders bundled blocks exactly as authored when there is no pedagogical role', () => {
    const block = renderBlock({ id: 'b1', latexContent: 'n^2 + n^3 \\leq 2n^3' });
    expect(visibleText(block)).not.toMatch(/^Therefore/);
  });

  it.each([
    ['assumption', 'Assume'],
    ['case split', 'Consider the case'],
    ['conclusion', 'Therefore, conclude'],
  ])('adds a learner-friendly transition for the %s role', (role, prefix) => {
    const block = renderBlock({ id: 'b1', latexContent: '\\(P \\land Q\\)', pedagogicalRole: role });
    expect(visibleText(block).startsWith(prefix)).toBe(true);
  });

  it('does not prefix blocks that already start with a transition', () => {
    const block = renderBlock({
      id: 'b1',
      latexContent: 'Hence \\(Q\\) holds.',
      pedagogicalRole: 'conclusion',
    });
    expect(visibleText(block).startsWith('Hence')).toBe(true);
  });

  it('marks the drag handle as disabled when the block is disabled', () => {
    const grip = (block) => block.querySelector('.proof-block__grip');
    expect(grip(renderBlock({ id: 'b1', latexContent: 'x' }))).toHaveAttribute('aria-disabled', 'false');
    expect(grip(renderBlock({ id: 'b2', latexContent: 'x', disabled: true }))).toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps the action buttons outside the drag handle so they are not nested interactive controls', () => {
    const block = renderBlock({ id: 'b1', latexContent: 'x', stepNumber: 2, onRemove: () => {}, onMoveUp: () => {}, canMoveUp: true });
    const grip = block.querySelector('.proof-block__grip');
    expect(grip).toHaveAttribute('role', 'button');
    expect(grip).toHaveAccessibleName('Drag step 2');
    for (const button of block.querySelectorAll('.proof-block__actions button')) {
      expect(button.closest('[role="button"]')).toBeNull();
    }
    expect(block).not.toHaveAttribute('role');
  });
});
