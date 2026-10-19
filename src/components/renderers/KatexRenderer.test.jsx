import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KatexRenderer from './KatexRenderer.jsx';
import { ALL_PUZZLES } from '../../services/puzzleLoader.js';
import { RAW_LATEX_PATTERN, visibleText } from '../../test/helpers.js';

function renderLatex(props) {
  const { container } = render(<KatexRenderer {...props} />);
  return container.firstChild;
}

describe('KatexRenderer', () => {
  it('renders legacy undelimited LaTeX through KaTeX instead of as raw source', () => {
    const el = renderLatex({ latex: '\\text{Consider } f(n) = n^2 + n^3 \\text{ and } g(n) = n^3.' });
    expect(el.querySelector('.katex')).not.toBeNull();
    expect(visibleText(el)).not.toMatch(RAW_LATEX_PATTERN);
    expect(visibleText(el)).toContain('Consider');
  });

  it('treats \\textbf and other text commands as legacy LaTeX', () => {
    const el = renderLatex({ latex: '\\textbf{Base case: } n = 0' });
    expect(visibleText(el)).not.toMatch(RAW_LATEX_PATTERN);
    expect(visibleText(el)).toContain('Base case');
  });

  it('renders generated prose as text with delimited inline math', () => {
    const el = renderLatex({ latex: 'Assume \\(P \\land Q\\) as a premise.' });
    expect(el.querySelectorAll('.katex-prose').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('.katex')).toHaveLength(1);
    expect(visibleText(el)).toMatch(/^Assume .+ as a premise\.$/);
  });

  it('keeps every character inside single-dollar math', () => {
    const el = renderLatex({ latex: 'Since $x$ is even, $x = 2k$ for some k.' });
    const maths = [...el.querySelectorAll('.katex-math')].map(visibleText);
    expect(maths).toEqual(['x', 'x=2k']);
  });

  it('renders placeholders as dropdowns when interactive and reports changes', async () => {
    const onVariableChange = vi.fn();
    const el = renderLatex({
      latex: 'f(n) = {{complexity}}(g(n)) \\text{ for all } n {{op}} n_0',
      isInteractive: true,
      onVariableChange,
      blockId: 'b1',
    });
    const selects = el.querySelectorAll('select');
    expect(selects).toHaveLength(2);
    expect(visibleText(el)).not.toMatch(RAW_LATEX_PATTERN);

    await userEvent.selectOptions(selects[0], '\\Theta');
    expect(onVariableChange).toHaveBeenCalledWith('complexity_0', '\\Theta');
  });

  it('substitutes selected values when not interactive', () => {
    const el = renderLatex({
      latex: 'f(n) = {{complexity}}(g(n))',
      variables: { complexity_0: '\\Omega' },
    });
    expect(el.querySelector('select')).toBeNull();
    expect(visibleText(el)).toContain('Ω');
  });

  describe.each(ALL_PUZZLES.map((puzzle) => [puzzle.id, puzzle]))('bundled puzzle %s', (_id, puzzle) => {
    const fragments = [puzzle.title, puzzle.statement, ...puzzle.blocks.map((block) => block.latex)];

    it.each([true, false])('renders without raw LaTeX or KaTeX errors (interactive=%s)', (isInteractive) => {
      for (const latex of fragments) {
        const el = renderLatex({ latex, isInteractive, onVariableChange: () => {} });
        expect(el.querySelector('.katex-error'), latex).toBeNull();
        expect(visibleText(el), latex).not.toMatch(RAW_LATEX_PATTERN);
      }
    });
  });
});
