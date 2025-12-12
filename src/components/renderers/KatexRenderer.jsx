import React, { useEffect, useRef } from 'react';
import katex from 'katex';

const KatexRenderer = ({ latex, variables = {}, onVariableChange, isInteractive = false, blockId = null }) => {
  const containerRef = useRef();

  const createDropdown = (uniqueKey, currentValue, onChange) => {
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
  };

  const getDropdownOptions = (type) => {
    switch (type) {
      case 'op':
        return [
          ['<', '<'],
          ['\\leq', '≤'],
          ['=', '='],
          ['\\geq', '≥'],
          ['>', '>'],
          ['\\neq', '≠']
        ];
      case 'quantifier':
        return [
          ['\\forall', '∀ (for all)'],
          ['\\exists', '∃ (exists)'],
          ['\\exists!', '∃! (exactly one)'],
          ['\\nexists', '∄ (does not exist)']
        ];
      case 'set':
      case 'setop':
        return [
          ['\\in', '∈ (element of)'],
          ['\\notin', '∉ (not element of)'],
          ['\\subset', '⊂ (proper subset)'],
          ['\\subseteq', '⊆ (subset)'],
          ['\\supset', '⊃ (proper superset)'],
          ['\\supseteq', '⊇ (superset)'],
          ['\\emptyset', '∅ (empty set)']
        ];
      case 'logic':
        return [
          ['\\land', '∧ (and)'],
          ['\\lor', '∨ (or)'],
          ['\\neg', '¬ (not)']
        ];
      case 'complexity':
        return [
          ['O', 'O (upper bound)'],
          ['\\Omega', 'Ω (lower bound)'],
          ['\\Theta', 'Θ (tight bound)']
        ];
      default:
        return [['', 'Select...']];
    }
  };

  const renderMixedContent = () => {
    if (!containerRef.current || !latex) return;

    try {
      // Find all placeholder patterns
      const placeholderPattern = /\{\{(\w+)\}\}/g;
      const placeholders = [...latex.matchAll(placeholderPattern)];
      
      if (placeholders.length === 0 || !isInteractive) {
        // No placeholders or not interactive, render as pure LaTeX
        let processedLatex = latex;
        
        // Replace placeholders with their selected values
        placeholders.forEach((match, index) => {
          const [fullMatch, varType] = match;
          const uniqueKey = `${varType}_${index}`;
          const value = variables[uniqueKey] || getDropdownOptions(varType)[0][0];
          processedLatex = processedLatex.replace(fullMatch, value);
        });
        
        katex.render(processedLatex, containerRef.current, {
          throwOnError: false,
          displayMode: false,
        });
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
            katex.render(latexBefore, span, { throwOnError: false, displayMode: false });
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
          katex.render(latexAfter, span, { throwOnError: false, displayMode: false });
          containerRef.current.appendChild(span);
        }
      }
      
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      containerRef.current.textContent = latex;
    }
  };

  useEffect(() => {
    renderMixedContent();
  }, [latex, variables, isInteractive, blockId]);

  return <span ref={containerRef} />;
};

export default KatexRenderer;