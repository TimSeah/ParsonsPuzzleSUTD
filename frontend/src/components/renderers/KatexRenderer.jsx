import React, { useCallback, useEffect, useRef } from 'react';
import katex from 'katex';
import { describeType, findChoice, nextChoice, parsePlaceholders } from '../../utils/placeholders';

const MATH_DELIMITER_PATTERN = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$(?!\$)[^$]+?\$)/g;

// KaTeX renders spaces inside \text{...} as non-breaking spaces, so long
// sentences could only wrap mid-word. Swap them for normal spaces in the
// visual output (the MathML copy for screen readers is left untouched).
// Explicit math spaces (\ , ~, \space) live in inline-block .mspace spans,
// where a normal space would collapse to zero width, so those are skipped.
const allowWordWrapping = (element) => {
  element.querySelectorAll('.katex-html').forEach((html) => {
    const walker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.nodeValue.includes('\u00a0') || node.parentElement?.closest('.mspace')) continue;
      node.nodeValue = node.nodeValue.replace(/\u00a0/g, ' ');
    }
  });
};

const renderLatex = (latex, element, displayMode = false) => {
  katex.render(latex, element, {
    throwOnError: false,
    displayMode,
    strict: false,
  });
  allowWordWrapping(element);
};

const normalizeLatexInput = (value) => String(value ?? '')
  // Values returned through JSON can occasionally be escaped twice.
  .replace(/\\\\(?=[()[\]])/g, '\\');

const escapeKatexText = (value) => value
  .replace(/\\/g, '\\textbackslash{}')
  .replace(/([{}%#$&_])/g, '\\$1');

const hasUndelimitedMath = (content) => /\\(?:bigl|bigr|Bigl|Bigr|land|lor|neg|to|rightarrow|leftrightarrow|in|notin|subset|subseteq|setminus|cup|cap|forall|exists|frac|sqrt|sum|mathbb|Theta|Omega)\b|[∧∨¬→↔∈∉⊂⊆∪∩∀∃≤≥≠]/.test(content);

// Convert old cached strings such as
// "From h, obtain P \\to R by \\to E" into one KaTeX expression while
// keeping normal English upright and spaced correctly.
const prepareUndelimitedLatex = (content) => content
  .split(/(\s+)/)
  .map((token) => {
    if (/^\s+$/.test(token)) return '\\;';
    if (/^[A-Za-z][A-Za-z'-]{1,}[,.;!?]?$/.test(token)) {
      const punctuation = token.match(/[,.;!?]$/)?.[0] || '';
      const word = punctuation ? token.slice(0, -1) : token;
      return `\\text{${escapeKatexText(word)}}${punctuation}`;
    }
    return token;
  })
  .join('');

const appendText = (container, text) => {
  if (!text) return;
  const span = document.createElement('span');
  span.className = 'katex-prose';
  span.textContent = text;
  container.appendChild(span);
};

const appendProseOrBareMath = (container, content) => {
  if (!content) return;
  if (!hasUndelimitedMath(content)) {
    appendText(container, content);
    return;
  }
  const span = document.createElement('span');
  span.className = 'katex-math';
  renderLatex(prepareUndelimitedLatex(content), span);
  container.appendChild(span);
};

const appendMath = (container, token) => {
  const isDisplay = token.startsWith('\\[') || token.startsWith('$$');
  const delimiterLength = token.startsWith('$') && !token.startsWith('$$') ? 1 : 2;
  const math = token.slice(delimiterLength, -delimiterLength).trim();
  const span = document.createElement(isDisplay ? 'div' : 'span');
  span.className = isDisplay ? 'katex-math katex-math-display' : 'katex-math';
  renderLatex(math, span, isDisplay);
  container.appendChild(span);
};

const renderDelimitedContent = (content, container) => {
  const tokens = content.split(MATH_DELIMITER_PATTERN);
  tokens.forEach((token) => {
    if (!token) return;
    if (/^(\\\[[\s\S]*\\\]|\\\([\s\S]*\\\)|\$\$[\s\S]*\$\$|\$(?!\$)[^$]+\$)$/.test(token)) {
      appendMath(container, token);
    } else {
      appendProseOrBareMath(container, token);
    }
  });
};

const hasMathDelimiters = (content) => {
  MATH_DELIMITER_PATTERN.lastIndex = 0;
  return MATH_DELIMITER_PATTERN.test(content);
};

// Bundled/educator puzzles are written entirely in LaTeX math mode (prose wrapped
// in \text{...}), while generated puzzles are English prose with delimited math.
// Treat undelimited content as legacy LaTeX unless it reads like English prose.
const isLegacyLatex = (content) => {
  if (hasMathDelimiters(content)) return false;
  if (/\\(?:text[a-z]*|math[a-z]+)\{/.test(content)) return true;
  const proseWords = content
    .replace(/\{\{\w+(?::[^{}]*)?\}\}/g, ' ')
    .replace(/\\[A-Za-z]+/g, ' ')
    .match(/\b[A-Za-z]{3,}\b/g) || [];
  return proseWords.length < 2;
};

// Shown for a placeholder that hasn't been chosen yet, so the step doesn't
// give the answer away.
const UNSET_SYMBOL = '\\square';

const createSymbolButton = (placeholder, selected, onChoose) => {
  const choice = findChoice(placeholder.type, selected);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `symbol-choice symbol-choice--${placeholder.type}${choice ? '' : ' symbol-choice--unset'}`;
  button.dataset.symbolKey = placeholder.key;
  button.setAttribute(
    'aria-label',
    `${describeType(placeholder.type)}: ${choice ? choice.name : 'not chosen'}. Press to change.`,
  );
  button.title = 'Click to change the symbol';

  if (choice) {
    const symbol = document.createElement('span');
    symbol.setAttribute('aria-hidden', 'true');
    renderLatex(choice.value, symbol);
    button.appendChild(symbol);
  } else {
    button.textContent = '?';
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onChoose(placeholder.key, nextChoice(placeholder.type, selected));
  });
  // Clicking a symbol must never start dragging the step it sits in.
  ['pointerdown', 'mousedown', 'touchstart', 'keydown'].forEach((type) => {
    button.addEventListener(type, (event) => event.stopPropagation());
  });
  return button;
};

/**
 * Renders a step's LaTeX. Placeholders such as {{op:\leq}} become buttons that
 * cycle through their symbols when `isInteractive`; otherwise they show the
 * selected symbol, the answer when `revealAnswers`, or an empty box.
 */
const KatexRenderer = ({ latex, variables = {}, onVariableChange, isInteractive = false, revealAnswers = false, blockId = null }) => {
  const containerRef = useRef();
  // Parents pass a new callback and selections object on every render (the
  // Timed challenge re-renders every second). Rebuilding the buttons each time
  // would drop clicks that straddle a rebuild, so only rebuild when the
  // selected values change and always call the latest callback.
  const onVariableChangeRef = useRef(onVariableChange);
  const variablesRef = useRef(variables);
  const variablesKey = JSON.stringify(variables || {});
  useEffect(() => {
    onVariableChangeRef.current = onVariableChange;
    variablesRef.current = variables;
  });

  const renderMixedContent = useCallback(() => {
    const container = containerRef.current;
    if (!container || !latex) return;
    const selections = variablesRef.current || {};

    // Rebuilding the DOM drops focus; put it back on the same symbol afterwards.
    const focusedKey = container.contains(document.activeElement)
      ? document.activeElement?.dataset?.symbolKey
      : null;

    try {
      const placeholders = parsePlaceholders(latex);
      const displayValue = (placeholder) => {
        const selected = findChoice(placeholder.type, selections[placeholder.key]);
        if (selected) return selected.value;
        if (revealAnswers && placeholder.answers.length > 0) return placeholder.answers[0];
        return UNSET_SYMBOL;
      };

      if (placeholders.length === 0 || !isInteractive) {
        // Render ordinary prose normally and only send delimited mathematics to
        // KaTeX. Rendering an entire English sentence as math removes spaces,
        // italicises the words, and displays parse failures in red.
        let processedLatex = normalizeLatexInput(latex);
        for (let i = placeholders.length - 1; i >= 0; i -= 1) {
          const placeholder = placeholders[i];
          processedLatex = processedLatex.slice(0, placeholder.start)
            + ` ${displayValue(placeholder)} `
            + processedLatex.slice(placeholder.end);
        }

        container.innerHTML = '';
        if (isLegacyLatex(processedLatex)) {
          renderLatex(processedLatex, container);
        } else if (hasMathDelimiters(processedLatex)) {
          renderDelimitedContent(processedLatex, container);
        } else if (hasUndelimitedMath(processedLatex)) {
          renderLatex(prepareUndelimitedLatex(processedLatex), container);
        } else {
          appendText(container, processedLatex);
        }
        return;
      }

      container.innerHTML = '';
      const legacyLatex = isLegacyLatex(normalizeLatexInput(latex));
      const appendFragment = (fragment) => {
        if (!fragment.trim()) return;
        const span = document.createElement('span');
        if (legacyLatex) {
          renderLatex(fragment, span);
        } else if (hasMathDelimiters(fragment)) {
          renderDelimitedContent(fragment, span);
        } else {
          appendText(span, fragment);
        }
        container.appendChild(span);
      };

      let lastIndex = 0;
      placeholders.forEach((placeholder) => {
        appendFragment(latex.substring(lastIndex, placeholder.start));
        container.appendChild(createSymbolButton(
          placeholder,
          selections[placeholder.key],
          (key, value) => onVariableChangeRef.current?.(key, value),
        ));
        lastIndex = placeholder.end;
      });
      appendFragment(latex.substring(lastIndex));

      if (focusedKey) {
        container.querySelector(`[data-symbol-key="${focusedKey}"]`)?.focus();
      }
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      container.textContent = latex;
    }
    // variablesKey stands in for `variables`, which is read through a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInteractive, latex, revealAnswers, variablesKey]);

  useEffect(() => {
    renderMixedContent();
  }, [blockId, renderMixedContent]);

  return <span ref={containerRef} className="mixed-latex-content" />;
};

export default KatexRenderer;
