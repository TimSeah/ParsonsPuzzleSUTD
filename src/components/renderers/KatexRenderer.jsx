import React, { useCallback, useEffect, useRef } from 'react';
import katex from 'katex';

const MATH_DELIMITER_PATTERN = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$(?!\$)[^$]+?\$)/g;

const renderLatex = (latex, element, displayMode = false) => {
  katex.render(latex, element, {
    throwOnError: false,
    displayMode,
    strict: false,
  });
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
  const delimiterLength = token.startsWith('$$') ? 2 : 2;
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

const isLegacyLatex = (content) => {
  const trimmed = content.trim();
  return /^\\(?:text|begin|frac|forall|exists|neg|sqrt|sum|prod|lim|mathbb|mathbf|mathrm)\b/.test(trimmed)
    || (!/\s/.test(trimmed) && /[\\^_={}]/.test(trimmed));
};

const getDropdownOptions = (type) => {
  switch (type) {
    case 'op':
      return [
        ['<', '<'], ['\\leq', '≤'], ['=', '='], ['\\geq', '≥'], ['>', '>'], ['\\neq', '≠']
      ];
    case 'quantifier':
      return [
        ['\\forall', '∀ (for all)'], ['\\exists', '∃ (exists)'],
        ['\\exists!', '∃! (exactly one)'], ['\\nexists', '∄ (does not exist)']
      ];
    case 'set':
    case 'setop':
      return [
        ['\\in', '∈ (element of)'], ['\\notin', '∉ (not element of)'],
        ['\\subset', '⊂ (proper subset)'], ['\\subseteq', '⊆ (subset)'],
        ['\\supset', '⊃ (proper superset)'], ['\\supseteq', '⊇ (superset)'],
        ['\\emptyset', '∅ (empty set)']
      ];
    case 'logic':
      return [['\\land', '∧ (and)'], ['\\lor', '∨ (or)'], ['\\neg', '¬ (not)']];
    case 'complexity':
      return [['O', 'O (upper bound)'], ['\\Omega', 'Ω (lower bound)'], ['\\Theta', 'Θ (tight bound)']];
    default:
      return [['', 'Select...']];
  }
};

const KatexRenderer = ({ latex, variables = {}, onVariableChange, isInteractive = false, blockId = null }) => {
  const containerRef = useRef();

  const createDropdown = useCallback((uniqueKey, currentValue, onChange) => {
    const varType = uniqueKey.split('_')[0]; // Extract type from unique key
    const options = getDropdownOptions(varType);
    const select = document.createElement('select');
    
    // Use CSS classes for styling instead of inline styles
    select.className = `dropdown-${varType}`;
    
    options.forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      if (value === currentValue) option.selected = true;
      select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
      e.stopPropagation();
      onChange(uniqueKey, e.target.value);
    });
    
    select.addEventListener('pointerdown', (e) => e.stopPropagation());
    
    return select;
  }, []);

  const renderMixedContent = useCallback(() => {
    if (!containerRef.current || !latex) return;

    try {
      // Find all placeholder patterns
      const placeholderPattern = /\{\{(\w+)\}\}/g;
      const placeholders = [...latex.matchAll(placeholderPattern)];
      
      if (placeholders.length === 0 || !isInteractive) {
        // Render ordinary prose normally and only send delimited mathematics to
        // KaTeX. Rendering an entire English sentence as math removes spaces,
        // italicises the words, and displays parse failures in red.
        let processedLatex = normalizeLatexInput(latex);
        
        // Replace placeholders with their selected values
        placeholders.forEach((match, index) => {
          const [fullMatch, varType] = match;
          const uniqueKey = `${varType}_${index}`;
          const value = variables[uniqueKey] || getDropdownOptions(varType)[0][0];
          processedLatex = processedLatex.replace(fullMatch, value);
        });
        
        containerRef.current.innerHTML = '';
        if (hasMathDelimiters(processedLatex)) {
          renderDelimitedContent(processedLatex, containerRef.current);
        } else if (hasUndelimitedMath(processedLatex)) {
          renderLatex(prepareUndelimitedLatex(processedLatex), containerRef.current);
        } else if (isLegacyLatex(processedLatex)) {
          renderLatex(processedLatex, containerRef.current);
        } else {
          appendText(containerRef.current, processedLatex);
        }
        return;
      }

      // Clear container
      containerRef.current.innerHTML = '';
      
      // Split latex by placeholders and render mixed content
      let lastIndex = 0;
      
      placeholders.forEach((match, index) => {
        const [fullMatch, varType] = match;
        const matchStart = match.index;
        
        // Render LaTeX before this placeholder
        if (matchStart > lastIndex) {
          const latexBefore = latex.substring(lastIndex, matchStart);
          if (latexBefore.trim()) {
            const span = document.createElement('span');
            if (hasMathDelimiters(latexBefore)) {
              renderDelimitedContent(latexBefore, span);
            } else {
              appendText(span, latexBefore);
            }
            containerRef.current.appendChild(span);
          }
        }
        
        // Create unique key for this specific dropdown instance
        const uniqueKey = `${varType}_${index}`;
        const currentValue = variables[uniqueKey] || getDropdownOptions(varType)[0][0];
        const dropdown = createDropdown(uniqueKey, currentValue, (key, value) => onVariableChange(key, value));
        containerRef.current.appendChild(dropdown);
        
        lastIndex = matchStart + fullMatch.length;
      });
      
      // Render remaining LaTeX after last placeholder
      if (lastIndex < latex.length) {
        const latexAfter = latex.substring(lastIndex);
        if (latexAfter.trim()) {
          const span = document.createElement('span');
          if (hasMathDelimiters(latexAfter)) {
            renderDelimitedContent(latexAfter, span);
          } else {
            appendText(span, latexAfter);
          }
          containerRef.current.appendChild(span);
        }
      }
      
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      containerRef.current.textContent = latex;
    }
  }, [createDropdown, isInteractive, latex, onVariableChange, variables]);

  useEffect(() => {
    renderMixedContent();
  }, [blockId, renderMixedContent]);

  return <span ref={containerRef} className="mixed-latex-content" />;
};

export default KatexRenderer;
