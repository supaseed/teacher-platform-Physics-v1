import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Center,
  Container,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";

import { useQuiz } from "../state/QuizContext";
import { Katex } from "../components/Katex";
import { ThemeToggle } from "../components/ThemeToggle";
import { containsLatex } from "../utils/latex";

export function QuizReportPage() {
  const navigate = useNavigate();
  const { questions, answers, resetQuizSession } = useQuiz();

  const summary = useMemo(() => {
    const records = questions
      .map((q) => answers[q.question_id] ?? null)
      .filter((r): r is NonNullable<typeof r> => r !== null);

    const correct = records.filter((r) => r.correct);
    const mistakes = records.filter((r) => !r.correct);

    return {
      total: questions.length,
      answered: records.length,
      score: correct.length,
      correct,
      mistakes,
    };
  }, [questions, answers]);

  if (questions.length === 0 || summary.answered === 0) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Text c="dimmed">no completed quiz to summarize.</Text>
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

  const handleNewQuiz = () => {
    resetQuizSession();
    navigate("/");
  };

  return (
    <Container size="lg" py="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={1} mb="xs">
              <span className="contrast-block">quiz</span>{" "}
              <span className="contrast-block contrast-block--accent">report</span>
            </Title>
            <Text c="dimmed">
              summary of your answers across {summary.total} questions.
            </Text>
          </Box>
          <ThemeToggle />
        </Group>

        <Paper withBorder p="lg" className="panel-surface">
          <Stack gap="sm">
            <Text className="meta-mono">total score</Text>
            <Title order={2}>
              {summary.score} / {summary.total}
            </Title>
            <Text c="dimmed" size="sm">
              {summary.mistakes.length === 0
                ? "perfect score — well done."
                : `${summary.mistakes.length} mistake${summary.mistakes.length === 1 ? "" : "s"} to review below.`}
            </Text>
          </Stack>
        </Paper>

        {summary.correct.length > 0 && (
          <Paper withBorder p="lg" className="panel-surface">
            <Stack gap="md">
              <Group gap="sm">
                <IconCheck size={18} color="var(--mantine-color-green-6)" />
                <Text className="meta-mono">correct answers</Text>
              </Group>
              <Divider color="var(--panel-border)" />
              <Stack gap="sm">
                {summary.correct.map((record) => (
                  <Group
                    key={record.questionId}
                    justify="space-between"
                    wrap="wrap"
                    align="flex-start"
                  >
                    <Text fw={600}>q{record.index + 1}</Text>
                    <Text ff="monospace" size="sm">
                      {record.correctValue} {record.correctUnit}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Paper>
        )}

        {summary.mistakes.length > 0 && (
          <Paper withBorder p="lg" className="panel-surface">
            <Stack gap="md">
              <Group gap="sm">
                <IconX size={18} color="var(--mantine-color-red-6)" />
                <Text className="meta-mono">mistakes</Text>
              </Group>
              <Divider color="var(--panel-border)" />
              <Stack gap="lg">
                {summary.mistakes.map((record) => (
                  <Box key={record.questionId}>
                    <Text fw={600} mb="xs">
                      q{record.index + 1}
                    </Text>
                    <Stack gap={6}>
                      <Group gap="xs" wrap="wrap">
                        <Text size="sm" c="dimmed">
                          your answer:
                        </Text>
                        <Text ff="monospace" size="sm" fw={600}>
                          {record.userAnswer}
                        </Text>
                      </Group>
                      <Group gap="xs" wrap="wrap">
                        <Text size="sm" c="dimmed">
                          correct answer:
                        </Text>
                        <Text ff="monospace" size="sm" fw={600}>
                          {record.correctValue} {record.correctUnit}
                        </Text>
                      </Group>
                      {record.rearrangedEquation &&
                        (containsLatex(record.rearrangedEquation) ? (
                          <Box>
                            <Text className="meta-mono" mb={4}>
                              required equation
                            </Text>
                            <Katex math={record.rearrangedEquation} block />
                          </Box>
                        ) : (
                          <Text ff="monospace" size="sm">
                            {record.rearrangedEquation}
                          </Text>
                        ))}
                    </Stack>
                    <Divider color="var(--panel-border)" mt="md" />
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Paper>
        )}

        <Group>
          <Button
            variant="default"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate("/quiz")}
            style={{ borderColor: "var(--panel-border)" }}
          >
            back to quiz
          </Button>
          <Button
            className="btn-ready"
            onClick={handleNewQuiz}
          >
            new quiz
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
