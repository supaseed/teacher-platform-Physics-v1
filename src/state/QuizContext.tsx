import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Question, DisplayContext } from "../api/apiTypes";
import type { ViewMode } from "../components/ViewModeToggle";
import { DEFAULT_DISPLAY_CONTEXT } from "../utils/displayContext";
import {
  DEFAULT_QUESTION_FONT_PRESET,
  loadStoredFontPreset,
  type QuestionFontPreset,
} from "../utils/questionFontSize";
import type { PracticeMode } from "../utils/subtopics";

export interface QuizPreferences {
  viewMode: ViewMode;
  generatePdf: boolean;
  largePrintPdf: boolean;
  questionFontPreset: QuestionFontPreset;
  displayContext: DisplayContext;
}

export interface QuestionAnswerRecord {
  questionId: string;
  index: number;
  correct: boolean;
  userAnswer: string;
  correctValue: number;
  correctUnit: string;
  baseEquation?: string;
  rearrangedEquation?: string;
}

const DEFAULT_PREFERENCES: QuizPreferences = {
  viewMode: "list",
  generatePdf: false,
  largePrintPdf: false,
  questionFontPreset: loadStoredFontPreset() ?? DEFAULT_QUESTION_FONT_PRESET,
  displayContext: DEFAULT_DISPLAY_CONTEXT,
};

interface QuizContextValue {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  startNewQuiz: (
    questions: Question[],
    practiceMode?: PracticeMode | null,
  ) => void;
  practiceMode: PracticeMode | null;
  preferences: QuizPreferences;
  setPreferences: (preferences: QuizPreferences) => void;
  answers: Record<string, QuestionAnswerRecord>;
  recordAnswer: (record: QuestionAnswerRecord) => void;
  resetQuizSession: () => void;
  isQuizComplete: boolean;
}

const QuizContext = createContext<QuizContextValue | undefined>(undefined);

/**
 * Holds the ephemeral generated quiz in memory so it survives navigation
 * between the selector and the quiz screen without relying on the query cache.
 */
export function QuizProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [practiceMode, setPracticeMode] = useState<PracticeMode | null>(null);
  const [preferences, setPreferences] =
    useState<QuizPreferences>(DEFAULT_PREFERENCES);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswerRecord>>(
    {},
  );

  const recordAnswer = useCallback((record: QuestionAnswerRecord) => {
    setAnswers((prev) => ({ ...prev, [record.questionId]: record }));
  }, []);

  const startNewQuiz = useCallback(
    (newQuestions: Question[], nextPracticeMode?: PracticeMode | null) => {
      setAnswers({});
      setQuestions(newQuestions);
      setPracticeMode(nextPracticeMode ?? null);
    },
    [],
  );

  const resetQuizSession = useCallback(() => {
    setQuestions([]);
    setAnswers({});
    setPracticeMode(null);
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  const isQuizComplete =
    questions.length > 0 &&
    questions.every((q) => answers[q.question_id] !== undefined);

  const value = useMemo<QuizContextValue>(
    () => ({
      questions,
      setQuestions,
      startNewQuiz,
      practiceMode,
      preferences,
      setPreferences,
      answers,
      recordAnswer,
      resetQuizSession,
      isQuizComplete,
    }),
    [
      questions,
      practiceMode,
      preferences,
      answers,
      recordAnswer,
      resetQuizSession,
      startNewQuiz,
      isQuizComplete,
    ],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return ctx;
}
