import type {
  GenerateQuizResponse,
  OptionLetter,
  Question,
  QuizOptions,
} from "./apiTypes";

const OPTION_LETTERS: OptionLetter[] = ["A", "B", "C", "D"];

/**
 * Coerce the raw `options` field into a clean {letter: string} map.
 *
 * Accepts either the current object form (`{A: "1 Pa", ...}`) or, defensively,
 * an array form (`["1 Pa", ...]`) so a future backend shape change doesn't blank
 * out the UI.
 */
function normalizeOptions(raw: unknown): QuizOptions {
  const options: QuizOptions = {};
  if (Array.isArray(raw)) {
    raw.forEach((value, i) => {
      const letter = OPTION_LETTERS[i];
      if (letter && value != null) options[letter] = String(value);
    });
    return options;
  }
  if (raw && typeof raw === "object") {
    for (const letter of OPTION_LETTERS) {
      const value = (raw as Record<string, unknown>)[letter];
      if (value != null) options[letter] = String(value);
    }
  }
  return options;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asOptionLetter(value: unknown): OptionLetter | undefined {
  return OPTION_LETTERS.includes(value as OptionLetter)
    ? (value as OptionLetter)
    : undefined;
}

/**
 * Map a raw backend question into the stable internal `Question` model, filling
 * sensible defaults for any missing field. Keeping this in one place means the
 * UI never has to defend against wire-format drift.
 */
export function normalizeQuestion(raw: Record<string, unknown>): Question {
  const correct_value_raw =
    typeof raw.correct_value_raw === "number" ? raw.correct_value_raw : undefined;

  // Prefer question_text; fall back to legacy rendered_question if present.
  const question_text =
    asString(raw.question_text) || asString(raw.rendered_question);

  return {
    question_id: asString(raw.question_id) || asString(raw.id),
    subtopic: asString(raw.subtopic),
    topic_key: asString(raw.topic_key),
    display_name: asString(raw.display_name),
    tranche: asString(raw.tranche),
    question_text,
    options: normalizeOptions(raw.options),
    answer_unit: asString(raw.answer_unit),
    uses_rearrangement: raw.uses_rearrangement === true,
    uses_conversion: raw.uses_conversion === true,
    correct_letter: asOptionLetter(raw.correct_letter),
    correct_value_raw,
    equation_latex: asString(raw.equation_latex) || undefined,
    correct_formula: asString(raw.correct_formula) || asString(raw.formula) || undefined,
  };
}

/** Normalize the full generate-quiz response, question-by-question. */
export function normalizeGenerateQuizResponse(
  raw: Record<string, unknown>,
): GenerateQuizResponse {
  const rawQuestions = Array.isArray(raw.questions) ? raw.questions : [];
  const questions = rawQuestions.map((q) =>
    normalizeQuestion((q ?? {}) as Record<string, unknown>),
  );

  return {
    requested_count:
      typeof raw.requested_count === "number" ? raw.requested_count : questions.length,
    count: typeof raw.count === "number" ? raw.count : questions.length,
    topics: Array.isArray(raw.topics) ? (raw.topics as string[]) : [],
    skipped_topics: Array.isArray(raw.skipped_topics)
      ? (raw.skipped_topics as string[])
      : [],
    quiz_mode:
      raw.quiz_mode === "custom" ||
      raw.quiz_mode === "beginner" ||
      raw.quiz_mode === "standard_progression" ||
      raw.quiz_mode === "randomised"
        ? raw.quiz_mode
        : undefined,
    tranche_selection: {
      include_rearrangements:
        (raw.tranche_selection as { include_rearrangements?: boolean })
          ?.include_rearrangements === true,
      include_conversions:
        (raw.tranche_selection as { include_conversions?: boolean })
          ?.include_conversions === true,
      tranches: Array.isArray(
        (raw.tranche_selection as { tranches?: unknown })?.tranches,
      )
        ? ((raw.tranche_selection as { tranches: string[] }).tranches.filter(
            (t): t is "A" | "B" | "C" | "D" =>
              t === "A" || t === "B" || t === "C" || t === "D",
          ) as ("A" | "B" | "C" | "D")[])
        : undefined,
    },
    allowed_tranches: Array.isArray(raw.allowed_tranches)
      ? (raw.allowed_tranches as string[])
      : [],
    include_answer: raw.include_answer !== false,
    include_formula: raw.include_formula !== false,
    questions,
  };
}
