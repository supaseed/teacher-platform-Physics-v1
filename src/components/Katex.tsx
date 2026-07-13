import katex from "katex";

import { normalizeMathInput } from "../utils/latex";

interface KatexProps {
  math: string;
  /** When true, render as a display (block) equation. */
  block?: boolean;
}

/**
 * Renders LaTeX via KaTeX. Uses katex directly (not react-katex) so Vite/ESM
 * interop with katex 0.17 cannot break rendering into a raw-text fallback.
 */
export function Katex({ math, block = false }: KatexProps) {
  const normalized = normalizeMathInput(math);
  if (!normalized) return null;

  try {
    const html = katex.renderToString(normalized, {
      displayMode: block,
      throwOnError: false,
      strict: false,
    });
    return (
      <span
        className={block ? "katex-block" : "katex-inline"}
        data-testid="react-katex"
        style={block ? { display: "block" } : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span style={{ fontFamily: "monospace" }}>{math}</span>;
  }
}

export { containsLatex } from "../utils/latex";
