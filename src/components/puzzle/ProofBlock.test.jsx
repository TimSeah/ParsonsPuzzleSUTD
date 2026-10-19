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

  it('marks the block as non-draggable when disabled', () => {
    expect(renderBlock({ id: 'b1', latexContent: 'x' })).toHaveAttribute('aria-disabled', 'false');
    expect(renderBlock({ id: 'b2', latexContent: 'x', disabled: true })).toHaveAttribute('aria-disabled', 'true');
  });
});
