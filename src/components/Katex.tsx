import { useMemo } from "react";
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
 *
 * Rendering is memoised so bulk grid updates (e.g. display-preference apply)
 * do not re-parse every equation synchronously on the main thread.
 */
export function Katex({ math, block = false }: KatexProps) {
  const rendered = useMemo(() => {
    const normalized = normalizeMathInput(math);
    if (!normalized) return { html: null as string | null, fallback: "" };

    try {
      const html = katex.renderToString(normalized, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      });
      return { html, fallback: "" };
    } catch {
      return { html: null, fallback: math };
    }
  }, [math, block]);

  if (rendered.html) {
    return (
      <span
        className={block ? "katex-block" : "katex-inline"}
        data-testid="react-katex"
        style={block ? { display: "block" } : undefined}
        dangerouslySetInnerHTML={{ __html: rendered.html }}
      />
    );
  }

  if (rendered.fallback) {
    return <span style={{ fontFamily: "monospace" }}>{rendered.fallback}</span>;
  }

  return null;
}

export { containsLatex } from "../utils/latex";
