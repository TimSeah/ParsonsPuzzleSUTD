// Text a user actually sees: KaTeX also emits hidden MathML containing the
// original LaTeX source.
export function visibleText(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll('.katex-mathml').forEach((node) => node.remove());
  return clone.textContent.replace(/\u00a0/g, ' ');
}

export const RAW_LATEX_PATTERN = /\\[A-Za-z]+|\{\{\w+(?::[^{}]*)?\}\}/;
