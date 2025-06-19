/**
 * @fileoverview KatexRenderer component - Mathematical notation rendering with KaTeX
 * 
 * This component safely renders LaTeX mathematical notation using the KaTeX library.
 * It provides error handling and fallback behavior for invalid LaTeX syntax.
 * 
 * Features:
 * - Safe LaTeX rendering with error handling
 * - Automatic re-rendering when content changes
 * - Fallback to raw text for invalid LaTeX
 * - Configurable display modes (inline vs block)
 * 
 * @author Parson's Puzzle SUTD Team
 */

import React, { useEffect, useRef } from 'react';
import katex from 'katex';

/**
 * Renders LaTeX mathematical notation using KaTeX
 * 
 * @param {Object} props - Component properties
 * @param {string} props.latex - LaTeX mathematical content to render
 * @param {boolean} [props.displayMode=false] - Whether to use display mode (block) or inline mode
 * @param {boolean} [props.throwOnError=false] - Whether to throw errors on invalid LaTeX
 * @returns {JSX.Element} Rendered mathematical notation
 */
const KatexRenderer = ({ latex, displayMode = false, throwOnError = false }) => {
  const containerRef = useRef();

  /**
   * Re-render KaTeX content whenever the latex prop changes
   */
  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        katex.render(latex, containerRef.current, {
          throwOnError, // Control error behavior
          displayMode, // false for inline, true for display math
          trust: false, // Disable potentially unsafe features for security
          strict: false, // Allow some non-standard LaTeX constructs
        });
      } catch (error) {
        console.error('KaTeX rendering error for:', latex, error);
        // Fallback: show raw LaTeX text if rendering fails
        if (containerRef.current) {
          containerRef.current.textContent = latex;
          containerRef.current.className = 'katex-fallback';
        }
      }
    } else if (containerRef.current) {
      // Clear content if no latex provided
      containerRef.current.textContent = '';
    }
  }, [latex, displayMode, throwOnError]);

  return (
    <span 
      ref={containerRef} 
      className="katex-container"
      title={latex} // Show raw LaTeX as tooltip for accessibility
    />
  );
};

export default KatexRenderer;