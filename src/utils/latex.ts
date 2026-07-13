/**
 * Strip common math delimiters so KaTeX receives raw LaTeX.
 */
export function normalizeMathInput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const displayDollar = trimmed.match(/^\$\$(.+)\$\$$/s);
  if (displayDollar) return displayDollar[1].trim();

  const inlineDollar = trimmed.match(/^\$(.+)\$$/s);
  if (inlineDollar) return inlineDollar[1].trim();

  const displayBracket = trimmed.match(/^\\\[(.+?)\\\]$/s);
  if (displayBracket) return displayBracket[1].trim();

  const inlineParen = trimmed.match(/^\\\((.+?)\\\)$/s);
  if (inlineParen) return inlineParen[1].trim();

  return trimmed;
}

/** True when a string likely contains LaTeX or math notation. */
export function containsLatex(text: string): boolean {
  const normalized = normalizeMathInput(text);
  return (
    normalized.includes("\\") ||
    /\$/.test(text) ||
    /\\frac|\\sqrt|\\text|\\times|\\cdot/.test(normalized)
  );
}
