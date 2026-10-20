import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
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

  it('uses normal spaces in rendered text so lines wrap between words', () => {
    const el = renderLatex({ latex: '\\text{Therefore, by mathematical induction, the claim holds for all } n.' });
    const html = el.querySelector('.katex-html');
    expect(html.textContent).not.toContain('\u00a0');
    expect(html.textContent).toContain('by mathematical induction');
  });

  it('keeps explicit math spaces such as \\  and ~ non-breaking so they keep their width', () => {
    const el = renderLatex({ latex: 'a\\ b~c' });
    const spaces = [...el.querySelectorAll('.katex-html .mspace')];
    expect(spaces.length).toBeGreaterThan(0);
    for (const space of spaces) expect(space.textContent).toBe('\u00a0');
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

  it('renders placeholders as symbol buttons that cycle on click, starting unset', async () => {
    const onVariableChange = vi.fn();
    const el = renderLatex({
      latex: 'f(n) = {{complexity:\\Theta}}(g(n)) \\text{ for all } n {{op:\\geq}} n_0',
      isInteractive: true,
      onVariableChange,
      blockId: 'b1',
    });
    expect(el.querySelector('select')).toBeNull();
    const buttons = el.querySelectorAll('button.symbol-choice');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName('Bound: not chosen. Press to change.');
    expect(buttons[0]).toHaveTextContent('?');
    expect(visibleText(el)).not.toMatch(RAW_LATEX_PATTERN);
    expect(visibleText(el)).not.toContain('Θ');

    await userEvent.click(buttons[0]);
    expect(onVariableChange).toHaveBeenLastCalledWith('complexity_0', 'O');
  });

  it('shows the chosen symbol and moves to the next one on each click, keeping focus', async () => {
    const user = userEvent.setup();
    function Stateful() {
      const [variables, setVariables] = useState({ op_0: '\\leq' });
      return (
        <KatexRenderer
          latex="n {{op:\\geq}} 1"
          isInteractive
          variables={variables}
          onVariableChange={(key, value) => setVariables((prev) => ({ ...prev, [key]: value }))}
        />
      );
    }
    render(<Stateful />);
    const button = () => screen.getByRole('button', { name: /^Relation:/ });
    expect(button()).toHaveAccessibleName('Relation: less than or equal to. Press to change.');

    await user.click(button());
    expect(button()).toHaveAccessibleName('Relation: equal to. Press to change.');
    expect(button()).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(button()).toHaveAccessibleName('Relation: greater than or equal to. Press to change.');
    expect(button()).toHaveFocus();
  });

  it('keeps the same buttons when the parent re-renders with new callbacks, and uses the latest one', async () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { container, rerender } = render(
      <KatexRenderer latex="n {{op:\\geq}} 1" isInteractive variables={{}} onVariableChange={first} />,
    );
    const button = container.querySelector('button.symbol-choice');

    rerender(<KatexRenderer latex="n {{op:\\geq}} 1" isInteractive variables={{}} onVariableChange={latest} />);
    expect(container.querySelector('button.symbol-choice')).toBe(button);

    await userEvent.click(button);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith('op_0', '<');
  });

  it('substitutes selected values when not interactive', () => {
    const el = renderLatex({
      latex: 'f(n) = {{complexity:\\Theta}}(g(n))',
      variables: { complexity_0: '\\Omega' },
    });
    expect(el.querySelector('button')).toBeNull();
    expect(visibleText(el)).toContain('Ω');
  });

  it('shows an empty box instead of the answer when nothing is chosen, unless answers are revealed', () => {
    const latex = 'f(n) = {{complexity:\\Theta}}(g(n))';
    const hidden = renderLatex({ latex });
    expect(visibleText(hidden)).not.toContain('Θ');
    expect(visibleText(hidden)).toContain('□');

    const revealed = renderLatex({ latex, revealAnswers: true });
    expect(visibleText(revealed)).toContain('Θ');
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
