import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Question } from "../api/apiTypes";
import type { ViewMode } from "../components/ViewModeToggle";

export interface QuizPreferences {
  viewMode: ViewMode;
  generatePdf: boolean;
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
};

interface QuizContextValue {
  questions: Question[];
  setQuestions: (questions: Question[]) => void;
  startNewQuiz: (questions: Question[]) => void;
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
  const [preferences, setPreferences] =
    useState<QuizPreferences>(DEFAULT_PREFERENCES);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswerRecord>>(
    {},
  );

  const recordAnswer = useCallback((record: QuestionAnswerRecord) => {
    setAnswers((prev) => ({ ...prev, [record.questionId]: record }));
  }, []);

  const startNewQuiz = useCallback((newQuestions: Question[]) => {
    setAnswers({});
    setQuestions(newQuestions);
  }, []);

  const resetQuizSession = useCallback(() => {
    setQuestions([]);
    setAnswers({});
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
      preferences,
      setPreferences,
      answers,
      recordAnswer,
      resetQuizSession,
      isQuizComplete,
    }),
    [
      questions,
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
