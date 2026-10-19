// Text a user actually sees: KaTeX also emits hidden MathML containing the
// original LaTeX source, and <select> option labels are not inline text.
export function visibleText(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll('.katex-mathml, select').forEach((node) => node.remove());
  return clone.textContent.replace(/\u00a0/g, ' ');
}

export const RAW_LATEX_PATTERN = /\\[A-Za-z]+|\{\{\w+\}\}/;
