import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconChevronLeft,
  IconChevronRight,
  IconPrinter,
} from "@tabler/icons-react";

import { useQuiz } from "../state/QuizContext";
import { QuestionCard } from "../components/QuestionCard";
import { ThemeToggle } from "../components/ThemeToggle";
import { ViewModeToggle, type ViewMode } from "../components/ViewModeToggle";

const LEAVE_CONFIRM_MESSAGE =
  "leave this quiz? your unique set of questions will be lost.";

export function QuizPage() {
  const navigate = useNavigate();
  const {
    questions,
    preferences,
    setPreferences,
    recordAnswer,
    answers,
    isQuizComplete,
    resetQuizSession,
  } = useQuiz();
  const [view, setView] = useState<ViewMode>(preferences.viewMode);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setView(preferences.viewMode);
  }, [preferences.viewMode]);

  useEffect(() => {
    if (preferences.generatePdf && questions.length > 0) {
      const timer = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(timer);
    }
  }, [preferences.generatePdf, questions.length]);

  useEffect(() => {
    if (!isQuizComplete) return;
    const timer = window.setTimeout(() => navigate("/quiz/report"), 800);
    return () => window.clearTimeout(timer);
  }, [isQuizComplete, navigate]);

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

  if (questions.length === 0) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <span className="contrast-block">no quiz loaded</span>
          <Text c="dimmed">generate a quiz from the selection screen first.</Text>
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

  const goPrev = () =>
    setCurrent((i) => (i - 1 + questions.length) % questions.length);
  const goNext = () => setCurrent((i) => (i + 1) % questions.length);

  const renderQuestionCard = (
    q: (typeof questions)[number],
    i: number,
    keyPrefix = "",
  ) => (
    <QuestionCard
      key={`${keyPrefix}${q.question_id}`}
      question={q}
      index={i}
      onAnswer={recordAnswer}
      savedAnswer={answers[q.question_id]}
    />
  );

  return (
    <Box>
      <Paper
        withBorder
        p="md"
        className="no-print panel-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderWidth: "0 0 1px 0",
        }}
      >
        <Container size="lg">
          <Group justify="space-between" wrap="wrap">
            <Group>
              <Button
                variant="default"
                leftSection={<IconArrowLeft size={16} />}
                onClick={handleBack}
                style={{
                  borderColor: "var(--panel-border)",
                  color: "var(--panel-text)",
                }}
              >
                back
              </Button>
              <Text className="meta-mono">
                {questions.length} questions
              </Text>
            </Group>
            <Group>
              <ViewModeToggle value={view} onChange={handleViewChange} />
              <Button
                variant="default"
                leftSection={<IconPrinter size={16} />}
                onClick={() => window.print()}
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
        </Container>
      </Paper>

      <Container size="lg" py="lg" className="quiz-content">
        <div className="quiz-screen">
          {view === "list" ? (
            <Stack gap="lg">
            {questions.map((q, i) => renderQuestionCard(q, i, "screen-"))}
            </Stack>
          ) : (
            <Stack gap="md">
              {renderQuestionCard(questions[current], current, "screen-")}

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
                  q{String(current + 1).padStart(2, "0")} /{" "}
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
      </Container>
    </Box>
  );
}
