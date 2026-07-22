export interface SplitQuestionText {
  /** Context / information part of the question. */
  stem: string;
  /** Exam-style delivery sentence (Calculate… / What is…), if found. */
  command: string | null;
}

/** Imperative / interrogative openers used in exam delivery sentences. */
const COMMAND_OPENER =
  "(?:Calculate|What is|What are|Find|Determine|Work out|Show that|State|Explain|Give|Write down|How many|Which)";

/**
 * Split question text into information (stem) and the delivery sentence
 * that should sit on its own line beneath, matching exam paper layout.
 *
 * Supports:
 * - explicit `// Calculate the...` markers from the backend
 * - plain `Calculate the...` / `What is the...` sentences after the stem
 */
export function splitQuestionText(text: string): SplitQuestionText {
  const trimmed = text.trim();
  if (!trimmed) {
    return { stem: "", command: null };
  }

  // Explicit // marker — preferred when present.
  const slashSplit = trimmed.match(/^(.*?)(?:\s*\/\/\s+)(.+)$/s);
  if (slashSplit) {
    const stem = slashSplit[1].trim();
    const command = slashSplit[2].trim();
    if (stem && command) {
      return { stem, command };
    }
    if (!stem && command) {
      return { stem: command, command: null };
    }
  }

  // Already on its own line after a blank line / newline.
  const lineSplit = trimmed.match(
    new RegExp(`^([\\s\\S]*?)\\n+\\s*(${COMMAND_OPENER}\\b[\\s\\S]*)$`, "i"),
  );
  if (lineSplit?.[1]?.trim() && lineSplit[2]?.trim()) {
    return {
      stem: lineSplit[1].trim(),
      command: lineSplit[2].trim(),
    };
  }

  // Same paragraph: stem ends with sentence punctuation, then command opener.
  const inlineSplit = trimmed.match(
    new RegExp(
      `^([\\s\\S]*?[.!?]["'\\]\\)]*)\\s+(${COMMAND_OPENER}\\b[\\s\\S]*)$`,
      "i",
    ),
  );
  if (inlineSplit?.[1]?.trim() && inlineSplit[2]?.trim()) {
    return {
      stem: inlineSplit[1].trim(),
      command: inlineSplit[2].trim(),
    };
  }

  return { stem: trimmed, command: null };
}

/**
 * Ensure a newline appears before an inline command sentence.
 * Prefer {@link splitQuestionText} + separate rendering for reliable layout.
 */
export function formatQuestionText(text: string): string {
  const { stem, command } = splitQuestionText(text);
  if (!command) return stem;
  return `${stem}\n\n${command}`;
}
