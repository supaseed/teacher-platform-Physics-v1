import type {
  OptionLetter,
  Question,
  QuizOptions,
} from "../api/apiTypes";

/** Result of checking a user's answer against the embedded answer key. */
export interface AnswerCheckResult {
  correct: boolean;
  correct_value: number;
  correct_unit: string;
  base_formula?: string;
  rearranged_formula?: string;
}

const OPTION_LETTERS: OptionLetter[] = ["A", "B", "C", "D"];

/** Normalise unit labels for display (e.g. keep "Pa" rather than "PA"). */
export function formatAnswerUnit(unit: string): string {
  const trimmed = unit.trim();
  if (!trimmed) return "";

  const known: Record<string, string> = {
    pa: "Pa",
    kpa: "kPa",
    mpa: "MPa",
    "m/s": "m/s",
    "m/s²": "m/s²",
    "m/s^2": "m/s²",
    "kg/m³": "kg/m³",
    "kg/m^3": "kg/m³",
    "n/kg": "N/kg",
    j: "J",
    w: "W",
    n: "N",
    c: "C",
    v: "V",
    a: "A",
    hz: "Hz",
    s: "s",
  };

  return known[trimmed.toLowerCase()] ?? trimmed;
}

/** Root/base equation for a question (not rearranged for the unknown). */
export function baseEquation(question: Question): string | undefined {
  return question.equation_latex || undefined;
}

/** Rearranged equation used to solve for the answer (reserved for future use). */
export function rearrangedEquation(_question: Question): string | undefined {
  return undefined;
}

/** True when the backend supplied at least one multiple-choice option. */
export function hasQuizOptions(options: QuizOptions | undefined): boolean {
  if (!options) return false;
  return OPTION_LETTERS.some((letter) => options[letter] !== undefined);
}

/** Stable A–D option list from the backend's letter-keyed map. */
export function optionEntries(
  options: QuizOptions,
): { letter: OptionLetter; label: string }[] {
  return OPTION_LETTERS.flatMap((letter) => {
    const label = options[letter];
    return label ? [{ letter, label }] : [];
  });
}

function valuesMatch(user: number, correct: number): boolean {
  if (!Number.isFinite(user) || !Number.isFinite(correct)) return false;
  if (correct === 0) return Math.abs(user) < 1e-9;
  return Math.abs(user - correct) / Math.abs(correct) < 0.01;
}

/**
 * Mark an answer locally using the answer key embedded in the question payload.
 * The backend is stateless, so no round-trip is required.
 */
export function checkAnswerLocally(
  question: Question,
  input:
    | { mode: "numeric"; value: number; unit?: string }
    | { mode: "choice"; letter: OptionLetter },
): AnswerCheckResult | null {
  const correctValue = question.correct_value_raw;
  if (correctValue === undefined) return null;

  const correctUnit = formatAnswerUnit(question.answer_unit);
  const base_formula = baseEquation(question);
  const rearranged_formula = rearrangedEquation(question);

  if (input.mode === "choice") {
    const correct = input.letter === question.correct_letter;
    return {
      correct,
      correct_value: correctValue,
      correct_unit: correctUnit,
      base_formula,
      rearranged_formula,
    };
  }

  const unitMatches =
    !input.unit ||
    !correctUnit ||
    formatAnswerUnit(input.unit) === correctUnit;

  return {
    correct: valuesMatch(input.value, correctValue) && unitMatches,
    correct_value: correctValue,
    correct_unit: correctUnit,
    base_formula,
    rearranged_formula,
  };
}
