export type QuestionFontPreset = "normal" | "classroom" | "large" | "extra-large";

export const QUESTION_FONT_PRESET_ORDER: QuestionFontPreset[] = [
  "normal",
  "classroom",
  "large",
  "extra-large",
];

export const QUESTION_FONT_PRESETS: Record<
  QuestionFontPreset,
  { label: string; rem: number }
> = {
  normal: { label: "small", rem: 1.05 },
  classroom: { label: "medium", rem: 1.5 },
  large: { label: "large", rem: 1.75 },
  "extra-large": { label: "extra large", rem: 2 },
};

export const DEFAULT_QUESTION_FONT_PRESET: QuestionFontPreset = "classroom";

const STORAGE_KEY = "quiz-question-font-preset";

function isQuestionFontPreset(value: string): value is QuestionFontPreset {
  return value in QUESTION_FONT_PRESETS;
}

export function loadStoredFontPreset(): QuestionFontPreset {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isQuestionFontPreset(stored)) {
      return stored;
    }
  } catch {
    /* ignore storage errors */
  }
  return DEFAULT_QUESTION_FONT_PRESET;
}

export function storeFontPreset(preset: QuestionFontPreset): void {
  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {
    /* ignore storage errors */
  }
}

export function stepFontPreset(
  current: QuestionFontPreset,
  direction: "up" | "down",
): QuestionFontPreset {
  const index = QUESTION_FONT_PRESET_ORDER.indexOf(current);
  const nextIndex =
    direction === "up"
      ? Math.min(index + 1, QUESTION_FONT_PRESET_ORDER.length - 1)
      : Math.max(index - 1, 0);
  return QUESTION_FONT_PRESET_ORDER[nextIndex];
}

export function fontPresetToRem(preset: QuestionFontPreset): number {
  return QUESTION_FONT_PRESETS[preset].rem;
}
