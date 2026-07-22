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
import type { ViewMode } from "./ViewModeToggle";
import { splitQuestionText } from "../utils/formatQuestionText";
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
  /** List view places action buttons on the right; single stays stacked. */
  layout?: ViewMode;
}

export function QuestionCard({
  question,
  index,
  onAnswer,
  savedAnswer,
  readOnly = false,
  layout = "single",
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
  const { stem, command } = splitQuestionText(question.question_text);
  /** Side action rail for interactive screen layouts (keeps prompt/answer wide). */
  const useActionRail = !readOnly;
  const optionsOpen = revealOptions && showOptions;

  const renderQuestionPart = (text: string) =>
    containsLatex(text) ? (
      <Katex math={text} />
    ) : (
      <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
    );

  const handleSubmit = () => {
    if (readOnly) return;

    let checkResult: AnswerCheckResult | null = null;

    if (optionsOpen) {
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
      optionsOpen && selectedLetter
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

  const answerInput =
    !readOnly && !optionsOpen ? (
      <Box className="no-print">
        <Group align="flex-end" gap="xs">
          <NumberInput
            label={
              <Text className="meta-mono" component="span">
                answer
              </Text>
            }
            placeholder="0.00"
            value={numericValue}
            onChange={setNumericValue}
            disabled={submitted}
            allowDecimal
            hideControls
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
      </Box>
    ) : null;

  const optionsPanel =
    !readOnly && optionsOpen ? (
      <div className="question-options-panel no-print">
        <Text className="meta-mono question-options-panel__label">
          select answer
        </Text>
        <Radio.Group
          value={selectedLetter}
          onChange={(value) => setSelectedLetter(value as OptionLetter)}
        >
          <Stack gap={4} mt={6}>
            {options.map(({ letter, label }) => (
              <Radio
                key={`${question.question_id}-${letter}`}
                value={letter}
                size="sm"
                label={
                  <Text component="span" className="mcq-option-label">
                    {letter}. {label}
                  </Text>
                }
                disabled={submitted}
                styles={{
                  root: { alignItems: "flex-start" },
                  body: { alignItems: "flex-start" },
                  labelWrapper: { paddingTop: 1 },
                  radio: {
                    borderColor: "var(--panel-border-accent)",
                  },
                }}
              />
            ))}
          </Stack>
        </Radio.Group>
      </div>
    ) : null;

  const expandedPanels = !readOnly ? (
    <>
      {/* Equation above working space when both are open */}
      <Collapse expanded={revealEquation} className="no-print">
        {baseFormula ? (
          <Paper
            withBorder
            p="sm"
            className="question-equation"
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

      <Collapse expanded={workingOpen} className="no-print">
        <div className="working-area" aria-label="space for working out" />
      </Collapse>
    </>
  ) : null;

  const actionButtons = !readOnly ? (
    <Stack gap="xs" className="question-card__actions no-print">
      <Button
        fullWidth
        variant={workingOpen ? "filled" : "default"}
        leftSection={<IconPencil size={16} />}
        onClick={toggleWorking}
        className="question-card__action-btn"
        style={
          workingOpen
            ? {
                backgroundColor: "var(--panel-accent)",
                color: "var(--panel-accent-text)",
              }
            : undefined
        }
      >
        space for working out
      </Button>
      {showOptions && (
        <Button
          fullWidth
          variant={revealOptions ? "filled" : "default"}
          leftSection={<IconListCheck size={16} />}
          onClick={toggleOptions}
          disabled={submitted}
          className="question-card__action-btn"
          style={
            revealOptions
              ? {
                  backgroundColor: "var(--panel-accent)",
                  color: "var(--panel-accent-text)",
                }
              : undefined
          }
        >
          options
        </Button>
      )}
      <Button
        fullWidth
        variant={revealEquation ? "filled" : "default"}
        leftSection={<IconMathFunction size={16} />}
        onClick={toggleEquation}
        className="question-card__action-btn"
        style={
          revealEquation
            ? {
                backgroundColor: "var(--panel-accent)",
                color: "var(--panel-accent-text)",
              }
            : undefined
        }
      >
        equation
      </Button>
      <Button
        fullWidth
        leftSection={<IconChevronDown size={16} />}
        onClick={handleSubmit}
        disabled={submitted}
        className="question-card__action-btn"
        style={{
          backgroundColor: "var(--panel-accent)",
          color: "var(--panel-accent-text)",
        }}
      >
        submit
      </Button>
    </Stack>
  ) : null;

  const feedback = (
    <>
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
    </>
  );

  const promptColumn = (
    <Stack gap="md" className="question-card__prompt">
      <Group justify="space-between" align="flex-start">
        <span className="contrast-block question-label">Q{index + 1}</span>
      </Group>

      <Box className="question-text">
        {renderQuestionPart(stem)}
        {command ? (
          <div className="question-command">{renderQuestionPart(command)}</div>
        ) : null}
      </Box>

      {answerInput}
      {expandedPanels}
      <div className="print-answer-box" />
      {feedback}
    </Stack>
  );

  return (
    <Paper
      withBorder
      p="md"
      className={[
        "print-question",
        "panel-surface",
        useActionRail ? "question-card--rail" : "",
        layout === "list" ? "question-card--list" : "",
        optionsOpen ? "question-card--options-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ borderColor: "var(--panel-border)" }}
    >
      {useActionRail ? (
        <div
          className={`question-card__grid${optionsOpen ? " question-card__grid--options" : ""}`}
        >
          {promptColumn}
          {optionsPanel}
          {actionButtons}
        </div>
      ) : (
        <Stack gap="md">{promptColumn}</Stack>
      )}

      <ReportModal
        questionId={question.question_id}
        opened={reportOpened}
        onClose={closeReport}
      />
    </Paper>
  );
}
