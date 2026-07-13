import { useEffect, useState } from "react";
import {
  Alert,
  Anchor,
  Box,
  Button,
  Collapse,
  Group,
  NumberInput,
  Paper,
  Radio,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCheck,
  IconChevronDown,
  IconListCheck,
  IconMathFunction,
  IconPencil,
  IconX,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import type { OptionLetter, Question } from "../api/apiTypes";
import { containsLatex, Katex } from "./Katex";
import { ReportModal } from "./ReportModal";
import type { QuestionAnswerRecord } from "../state/QuizContext";
import {
  baseEquation,
  checkAnswerLocally,
  formatAnswerUnit,
  hasQuizOptions,
  optionEntries,
  type AnswerCheckResult,
} from "../utils/questions";

interface QuestionCardProps {
  question: Question;
  index: number;
  onAnswer?: (record: QuestionAnswerRecord) => void;
  savedAnswer?: QuestionAnswerRecord;
  readOnly?: boolean;
}

export function QuestionCard({
  question,
  index,
  onAnswer,
  savedAnswer,
  readOnly = false,
}: QuestionCardProps) {
  const [workingOpen, { toggle: toggleWorking }] = useDisclosure(false);
  const [revealOptions, { toggle: toggleOptions }] = useDisclosure(false);
  const [revealEquation, { toggle: toggleEquation }] = useDisclosure(false);
  const [reportOpened, { open: openReport, close: closeReport }] =
    useDisclosure(false);

  const [numericValue, setNumericValue] = useState<number | string>("");
  const [selectedLetter, setSelectedLetter] = useState<OptionLetter | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(Boolean(savedAnswer));
  const [result, setResult] = useState<AnswerCheckResult | null>(
    savedAnswer
      ? {
          correct: savedAnswer.correct,
          correct_value: savedAnswer.correctValue,
          correct_unit: savedAnswer.correctUnit,
          base_formula: savedAnswer.baseEquation,
          rearranged_formula: savedAnswer.rearrangedEquation,
        }
      : null,
  );

  useEffect(() => {
    if (!savedAnswer) return;
    setSubmitted(true);
    setResult({
      correct: savedAnswer.correct,
      correct_value: savedAnswer.correctValue,
      correct_unit: savedAnswer.correctUnit,
      base_formula: savedAnswer.baseEquation,
      rearranged_formula: savedAnswer.rearrangedEquation,
    });
  }, [savedAnswer]);

  const showOptions = hasQuizOptions(question.options);
  const options = optionEntries(question.options);
  const unitLabel = formatAnswerUnit(question.answer_unit);
  const baseFormula = baseEquation(question);

  const handleSubmit = () => {
    if (readOnly) return;

    let checkResult: AnswerCheckResult | null = null;

    if (revealOptions && showOptions) {
      if (!selectedLetter) {
        notifications.show({
          color: "orange",
          message: "select an option before submitting.",
        });
        return;
      }
      checkResult = checkAnswerLocally(question, {
        mode: "choice",
        letter: selectedLetter,
      });
    } else {
      const value =
        typeof numericValue === "number"
          ? numericValue
          : numericValue.trim() === ""
            ? null
            : Number(numericValue);

      if (value === null || Number.isNaN(value)) {
        notifications.show({
          color: "orange",
          message: "enter an answer before submitting.",
        });
        return;
      }

      checkResult = checkAnswerLocally(question, {
        mode: "numeric",
        value,
        unit: unitLabel,
      });
    }

    if (!checkResult) {
      notifications.show({
        color: "orange",
        message: "this question has no answer key to check against.",
      });
      return;
    }

    const userAnswer =
      revealOptions && showOptions && selectedLetter
        ? `${selectedLetter}. ${options.find((o) => o.letter === selectedLetter)?.label ?? ""}`
        : `${typeof numericValue === "number" ? numericValue : numericValue} ${unitLabel}`.trim();

    setResult(checkResult);
    setSubmitted(true);

    onAnswer?.({
      questionId: question.question_id,
      index,
      correct: checkResult.correct,
      userAnswer,
      correctValue: checkResult.correct_value,
      correctUnit: checkResult.correct_unit,
      baseEquation: checkResult.base_formula,
      rearrangedEquation: checkResult.rearranged_formula,
    });
  };

  return (
    <Paper
      withBorder
      p="lg"
      className="print-question panel-surface"
      style={{ borderColor: "var(--panel-border)" }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <span className="contrast-block">q{index + 1}</span>
        </Group>

        <Box className="question-text">
          {containsLatex(question.question_text) ? (
            <Katex math={question.question_text} />
          ) : (
            <Text style={{ whiteSpace: "pre-wrap" }}>{question.question_text}</Text>
          )}
        </Box>

        {!readOnly && (
          <Collapse expanded={workingOpen} className="no-print">
            <div className="working-area" aria-label="space for working out" />
          </Collapse>
        )}

        {!readOnly && (
          <Collapse expanded={revealEquation} className="no-print">
            {baseFormula ? (
              <Paper
                withBorder
                p="sm"
                style={{
                  backgroundColor: "var(--panel-surface-raised)",
                  borderColor: "var(--panel-border)",
                }}
              >
                <Text className="meta-mono" mb="xs">
                  equation
                </Text>
                <Katex math={baseFormula} block />
              </Paper>
            ) : (
              <Text c="dimmed" size="sm">
                no equation available for this question.
              </Text>
            )}
          </Collapse>
        )}

        {!readOnly && (
          <Box className="no-print">
            {revealOptions && showOptions ? (
              <Radio.Group
                value={selectedLetter}
                onChange={(value) => setSelectedLetter(value as OptionLetter)}
                label={
                  <Text className="meta-mono" component="span">
                    select answer
                  </Text>
                }
              >
                <Stack gap="xs" mt="xs">
                  {options.map(({ letter, label }) => (
                    <Radio
                      key={`${question.question_id}-${letter}`}
                      value={letter}
                      label={
                        <Text component="span" ff="monospace" size="sm">
                          {letter}. {label}
                        </Text>
                      }
                      disabled={submitted}
                      styles={{
                        radio: {
                          borderColor: "var(--panel-border-accent)",
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Radio.Group>
            ) : (
              <Group align="flex-end" gap="xs">
                <NumberInput
                  label={
                    <Text className="meta-mono" component="span">
                      your answer
                    </Text>
                  }
                  placeholder="0.00"
                  value={numericValue}
                  onChange={setNumericValue}
                  disabled={submitted}
                  allowDecimal
                  style={{ maxWidth: 220 }}
                  styles={{
                    input: {
                      fontFamily: '"JetBrains Mono", monospace',
                      borderColor: "var(--panel-border)",
                    },
                  }}
                />
                {unitLabel ? (
                  <Text className="meta-mono" pb={8}>
                    {unitLabel}
                  </Text>
                ) : null}
              </Group>
            )}
          </Box>
        )}

        <div className="print-answer-box" />

        {!readOnly && (
          <Group gap={0} className="no-print" mt="xs" wrap="wrap">
            <Button
              variant={workingOpen ? "filled" : "default"}
              leftSection={<IconPencil size={16} />}
              onClick={toggleWorking}
              style={{
                borderRight: "none",
                ...(workingOpen
                  ? {
                      backgroundColor: "var(--panel-accent)",
                      color: "var(--panel-accent-text)",
                    }
                  : {}),
              }}
            >
              space for working out
            </Button>
            {showOptions && (
              <Button
                variant={revealOptions ? "filled" : "default"}
                leftSection={<IconListCheck size={16} />}
                onClick={toggleOptions}
                disabled={submitted}
                style={{
                  borderRight: "none",
                  ...(revealOptions
                    ? {
                        backgroundColor: "var(--panel-accent)",
                        color: "var(--panel-accent-text)",
                      }
                    : {}),
                }}
              >
                options
              </Button>
            )}
            <Button
              variant={revealEquation ? "filled" : "default"}
              leftSection={<IconMathFunction size={16} />}
              onClick={toggleEquation}
              style={{
                borderRight: "none",
                ...(revealEquation
                  ? {
                      backgroundColor: "var(--panel-accent)",
                      color: "var(--panel-accent-text)",
                    }
                  : {}),
              }}
            >
              equation
            </Button>
            <Button
              leftSection={<IconChevronDown size={16} />}
              onClick={handleSubmit}
              disabled={submitted}
              style={{
                backgroundColor: "var(--panel-accent)",
                color: "var(--panel-accent-text)",
              }}
            >
              submit
            </Button>
          </Group>
        )}

        {result && (
          <Alert
            className="no-print"
            color={result.correct ? "green" : "red"}
            icon={result.correct ? <IconCheck /> : <IconX />}
            title={result.correct ? "correct!" : "not quite"}
            styles={{
              root: { border: "1px solid var(--panel-border)" },
            }}
          >
            <Stack gap={4}>
              <Text size="sm">
                correct answer:{" "}
                <Text component="span" ff="monospace" fw={700} inherit>
                  {result.correct_value} {result.correct_unit}
                </Text>
              </Text>
              {!result.correct && result.rearranged_formula && (
                <Box>
                  <Text className="meta-mono" mb={4}>
                    rearranged equation
                  </Text>
                  <Katex math={result.rearranged_formula} block />
                </Box>
              )}
            </Stack>
          </Alert>
        )}

        {!readOnly && (
          <Group className="no-print" mt={4}>
            <Anchor
              size="xs"
              c="var(--panel-text-muted)"
              onClick={openReport}
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              report question
            </Anchor>
          </Group>
        )}
      </Stack>

      <ReportModal
        questionId={question.question_id}
        opened={reportOpened}
        onClose={closeReport}
      />
    </Paper>
  );
}
