import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Center,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
  IconMinimize,
  IconPrinter,
} from "@tabler/icons-react";

import { useQuiz } from "../state/QuizContext";
import { QuestionCard } from "../components/QuestionCard";
import { QuestionFontControls } from "../components/QuestionFontControls";
import { ThemeToggle } from "../components/ThemeToggle";
import { ViewModeToggle, type ViewMode } from "../components/ViewModeToggle";
import { printQuizPdf } from "../utils/printQuiz";
import {
  storeFontPreset,
  type QuestionFontPreset,
} from "../utils/questionFontSize";
import { PRACTICE_MODE_LABELS } from "../utils/subtopics";

const LEAVE_CONFIRM_MESSAGE =
  "leave this practice set? your unique set of questions will be lost.";

/** Near-full width so question text can use the screen; keep a small inset. */
const QUIZ_CONTENT_PADDING = "0.75rem";

export function QuizPage() {
  const navigate = useNavigate();
  const {
    questions,
    practiceMode,
    preferences,
    setPreferences,
    recordAnswer,
    answers,
    isQuizComplete,
    resetQuizSession,
  } = useQuiz();
  const [view, setView] = useState<ViewMode>(preferences.viewMode);
  const [current, setCurrent] = useState(0);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pendingPrintRef = useRef<boolean | null>(null);

  useEffect(() => {
    setView(preferences.viewMode);
  }, [preferences.viewMode]);

  useEffect(() => {
    if (preferences.generatePdf && questions.length > 0) {
      const timer = window.setTimeout(() => {
        void printQuizPdf({ includeLargePrint: preferences.largePrintPdf });
      }, 400);
      return () => window.clearTimeout(timer);
    }
  }, [preferences.generatePdf, preferences.largePrintPdf, questions.length]);

  useEffect(() => {
    if (!isQuizComplete) return;
    const timer = window.setTimeout(() => navigate("/quiz/report"), 800);
    return () => window.clearTimeout(timer);
  }, [isQuizComplete, navigate]);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
    };
  }, []);

  const handleViewChange = (next: ViewMode) => {
    setView(next);
    setPreferences({ ...preferences, viewMode: next });
    if (next === "single") {
      setCurrent(0);
    }
  };

  const handleBack = () => {
    const confirmed = window.confirm(
      `are you sure you want to ${LEAVE_CONFIRM_MESSAGE}`,
    );
    if (confirmed) {
      resetQuizSession();
      navigate("/");
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen can be blocked by the browser; ignore quietly.
    }
  };

  if (questions.length === 0) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <span className="contrast-block">no practice set loaded</span>
          <Text c="dimmed">generate a practice set from the selection screen first.</Text>
          <Button
            onClick={() => navigate("/")}
            leftSection={<IconArrowLeft size={16} />}
            style={{
              backgroundColor: "var(--panel-accent)",
              color: "var(--panel-accent-text)",
            }}
          >
            back to selection
          </Button>
        </Stack>
      </Center>
    );
  }

  const handleFontPresetChange = (preset: QuestionFontPreset) => {
    storeFontPreset(preset);
    setPreferences({ ...preferences, questionFontPreset: preset });
  };

  const handlePrintPdf = () => {
    setPrintDialogOpen(true);
  };

  const handlePrintConfirm = (includeLargePrint: boolean) => {
    pendingPrintRef.current = includeLargePrint;
    setPrintDialogOpen(false);
  };

  const handlePrintDialogExit = () => {
    if (pendingPrintRef.current === null) return;
    const includeLargePrint = pendingPrintRef.current;
    pendingPrintRef.current = null;
    void printQuizPdf({ includeLargePrint });
  };

  const fontPreset = preferences.questionFontPreset ?? "classroom";
  const practiceLabel =
    practiceMode != null ? PRACTICE_MODE_LABELS[practiceMode] : null;

  const goPrev = () =>
    setCurrent((i) => (i - 1 + questions.length) % questions.length);
  const goNext = () => setCurrent((i) => (i + 1) % questions.length);

  const renderQuestionCard = (
    q: (typeof questions)[number],
    i: number,
    keyPrefix = "",
    layout: ViewMode = "single",
  ) => (
    <QuestionCard
      key={`${keyPrefix}${q.question_id}`}
      question={q}
      index={i}
      onAnswer={recordAnswer}
      savedAnswer={answers[q.question_id]}
      layout={layout}
    />
  );

  return (
    <Box className="quiz-page">
      <Box
        py="md"
        pb={88}
        px={QUIZ_CONTENT_PADDING}
        className="quiz-content"
      >
        <div className="quiz-screen" data-font-preset={fontPreset}>
          {view === "list" ? (
            <Stack gap="sm">
              {questions.map((q, i) =>
                renderQuestionCard(q, i, "screen-", "list"),
              )}
            </Stack>
          ) : (
            <Stack gap="md">
              {renderQuestionCard(questions[current], current, "screen-", "single")}

              <div className="console-bar no-print">
                <button
                  type="button"
                  className="console-bar__btn"
                  onClick={goPrev}
                  aria-label="previous question"
                >
                  <IconChevronLeft size={16} />
                  prev
                </button>
                <div className="console-bar__counter">
                  Q{String(current + 1).padStart(2, "0")} /{" "}
                  {String(questions.length).padStart(2, "0")}
                </div>
                <button
                  type="button"
                  className="console-bar__btn"
                  onClick={goNext}
                  aria-label="next question"
                >
                  next
                  <IconChevronRight size={16} />
                </button>
              </div>
            </Stack>
          )}
        </div>

        <div className="quiz-print-all" aria-hidden="true">
          <Stack gap="lg">
            {questions.map((q, i) => renderQuestionCard(q, i, "print-"))}
          </Stack>
        </div>

        <div className="quiz-print-all-large" aria-hidden="true">
          <div className="print-large-banner">Large print (18pt)</div>
          <Stack gap="lg">
            {questions.map((q, i) => renderQuestionCard(q, i, "print-large-"))}
          </Stack>
        </div>
      </Box>

      <Paper
        withBorder
        className="no-print panel-header panel-header--bottom quiz-banner"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 100,
          borderWidth: "1px 0 0 0",
        }}
      >
        <Box px={QUIZ_CONTENT_PADDING} className="quiz-banner-row">
          <Group gap="sm" className="quiz-banner-row__start" wrap="nowrap">
            <Button
              variant="default"
              size="sm"
              leftSection={<IconArrowLeft size={16} />}
              onClick={handleBack}
              style={{
                borderColor: "var(--panel-border)",
                color: "var(--panel-text)",
              }}
            >
              back to equations
            </Button>
            <Text className="meta-mono">
              {questions.length} questions
            </Text>
          </Group>

          <Text
            className="practice-mode-label quiz-banner-row__center"
            data-empty={!practiceLabel || undefined}
          >
            {practiceLabel ?? "practice set"}
          </Text>

          <Group
            gap="md"
            className="quiz-banner-row__end"
            justify="flex-end"
            wrap="nowrap"
            align="center"
          >
            <QuestionFontControls
              preset={fontPreset}
              onPresetChange={handleFontPresetChange}
            />
            <div className="quiz-banner-divider" aria-hidden="true" />
            <Group gap="xs" wrap="nowrap" align="center">
              <ViewModeToggle value={view} onChange={handleViewChange} />
              <Button
                variant="default"
                size="sm"
                leftSection={
                  isFullscreen ? (
                    <IconMinimize size={16} />
                  ) : (
                    <IconMaximize size={16} />
                  )
                }
                onClick={() => void handleToggleFullscreen()}
                style={{
                  borderColor: "var(--panel-border)",
                  color: "var(--panel-text)",
                }}
              >
                {isFullscreen ? "exit full screen" : "full screen"}
              </Button>
              <Button
                variant="default"
                size="sm"
                leftSection={<IconPrinter size={16} />}
                onClick={handlePrintPdf}
                style={{
                  borderColor: "var(--panel-border)",
                  color: "var(--panel-text)",
                }}
              >
                pdf
              </Button>
              <ThemeToggle />
            </Group>
          </Group>
        </Box>
      </Paper>

      <Modal
        opened={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        onExitTransitionEnd={handlePrintDialogExit}
        classNames={{ root: "no-print" }}
        title={
          <Text fw={700} size="lg">
            export pdf
          </Text>
        }
        size="sm"
        styles={{
          content: { backgroundColor: "var(--panel-surface)" },
          header: { backgroundColor: "var(--panel-surface)" },
        }}
      >
        <Stack gap="lg">
          <Text>
            also generate a large print pdf for visually impaired learners?
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => handlePrintConfirm(false)}
              style={{
                borderColor: "var(--panel-border)",
                color: "var(--panel-text)",
              }}
            >
              no
            </Button>
            <Button onClick={() => handlePrintConfirm(true)} className="btn-ready">
              yes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
