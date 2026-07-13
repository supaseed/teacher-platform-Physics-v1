import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

import { useGenerateQuiz, useSubtopicMeta } from "../api/hooks";
import { useQuiz } from "../state/QuizContext";
import { SubtopicCard } from "../components/SubtopicCard";
import { SquareCheckbox, SquareCheckboxLabel } from "../components/SquareCheckbox";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  QuizConfigModal,
  type QuizConfig,
} from "../components/QuizConfigModal";
import {
  buildVariantSelection,
  computeVariantAvailability,
  selectedTopicKeys,
  splitByPaper,
  toEntries,
} from "../utils/subtopics";
import type { SubtopicEntry } from "../api/apiTypes";

const DEFAULT_CONFIG: QuizConfig = {
  questionTypeMode: "standard",
  rearrangements: false,
  conversions: false,
  questionCount: 10,
  viewMode: "list",
  generatePdf: false,
};

function PaperColumn({
  title,
  entries,
  selectedIds,
  showSpecCodes,
  onToggle,
  onSelectAll,
}: {
  title: string;
  entries: SubtopicEntry[];
  selectedIds: string[];
  showSpecCodes: boolean;
  onToggle: (id: string) => void;
  onSelectAll: (select: boolean) => void;
}) {
  const selectedCount = entries.filter((e) => selectedIds.includes(e.id)).length;
  const allSelected = entries.length > 0 && selectedCount === entries.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <Stack gap="sm" h="100%">
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          <SquareCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            disabled={entries.length === 0}
            onChange={() => onSelectAll(!allSelected)}
            aria-label={`Select all ${title} equations`}
          />
          <Title order={3} style={{ display: "inline-flex", alignItems: "center" }}>
            <span className="section-accent-bar" />
            {title}
          </Title>
        </Group>
        <Text className="meta-mono">{entries.length} eq</Text>
      </Group>
      {entries.length === 0 ? (
        <Text c="dimmed" size="sm">
          No subtopics for this paper.
        </Text>
      ) : (
        <div className="topic-grid">
          {entries.map((entry) => (
            <SubtopicCard
              key={entry.id}
              entry={entry}
              selected={selectedIds.includes(entry.id)}
              showSpecCode={showSpecCodes}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </Stack>
  );
}

export function SelectorPage() {
  const navigate = useNavigate();
  const { startNewQuiz, setPreferences } = useQuiz();
  const { data: meta, isLoading, isError, error, refetch } = useSubtopicMeta();
  const generateQuiz = useGenerateQuiz();
  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] =
    useDisclosure(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSpecCodes, setShowSpecCodes] = useState(false);
  const [config, setConfig] = useState<QuizConfig>(DEFAULT_CONFIG);

  const { paper1, paper2 } = useMemo(
    () => (meta ? splitByPaper(toEntries(meta)) : { paper1: [], paper2: [] }),
    [meta],
  );

  const availability = useMemo(
    () =>
      meta
        ? computeVariantAvailability(selectedIds, meta)
        : { rearrangements: false, conversions: false },
    [selectedIds, meta],
  );

  const isVariants = config.questionTypeMode === "variants";
  const rearrangeDisabled = !isVariants || !availability.rearrangements;
  const conversionsDisabled = !isVariants || !availability.conversions;

  const effectiveRearrangements = !rearrangeDisabled && config.rearrangements;
  const effectiveConversions = !conversionsDisabled && config.conversions;

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllPaper = (entries: SubtopicEntry[], select: boolean) => {
    const ids = entries.map((e) => e.id);
    setSelectedIds((prev) => {
      if (select) {
        return [...new Set([...prev, ...ids])];
      }
      const idSet = new Set(ids);
      return prev.filter((id) => !idSet.has(id));
    });
  };

  const handleReadyClick = () => {
    if (selectedIds.length === 0) {
      notifications.show({
        color: "orange",
        message: "Select at least one equation first.",
      });
      return;
    }
    openConfigModal();
  };

  const handleGenerate = () => {
    if (!meta || selectedIds.length === 0) return;

    const variant_selection = buildVariantSelection(
      config.questionTypeMode,
      effectiveRearrangements,
      effectiveConversions,
    );
    const topics = selectedTopicKeys(selectedIds, meta);

    generateQuiz.mutate(
      {
        topics,
        tranche_selection: variant_selection,
        include_answer: true,
        include_formula: true,
        count: config.questionCount,
      },
      {
        onSuccess: (data) => {
          startNewQuiz(data.questions);
          setPreferences({
            viewMode: config.viewMode,
            generatePdf: config.generatePdf,
          });
          closeConfigModal();
          navigate("/quiz");
        },
        onError: (err) => {
          notifications.show({
            color: "red",
            title: "Could not generate quiz",
            message: err.message,
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Loader color="var(--panel-accent)" />
          <Text className="meta-mono">Loading subtopics…</Text>
        </Stack>
      </Center>
    );
  }

  if (isError || !meta) {
    return (
      <Container size="sm" py="xl">
        <Alert color="red" title="failed to load subtopics">
          {error instanceof Error ? error.message : "Unknown error"}
          <Group mt="md">
            <Button
              variant="default"
              onClick={() => refetch()}
              style={{ borderColor: "var(--panel-border)" }}
            >
              retry
            </Button>
          </Group>
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={1} mb="xs">
              <span className="contrast-block">physics</span>{" "}
              <span className="contrast-block contrast-block--accent">
                question generator
              </span>
            </Title>
            <Text c="dimmed" maw={560}>
              Choose from the equations below to instantly generate your own unique quiz.
            </Text>
          </Box>
          <Group gap="sm" align="center">
            <Button
              size="lg"
              className="btn-ready"
              onClick={handleReadyClick}
              disabled={selectedIds.length === 0}
            >
              ready?
            </Button>
            <ThemeToggle />
          </Group>
        </Group>

        <Group justify="space-between" align="center">
          <SquareCheckboxLabel
            label="show AQA specification reference"
            checked={showSpecCodes}
            onChange={setShowSpecCodes}
          />
          <Text className="meta-mono">
            {selectedIds.length} selected
          </Text>
        </Group>

        <Grid>
          <Grid.Col
            span={{ base: 12, md: 6 }}
            style={{ borderRight: "1px solid var(--panel-border)" }}
          >
            <Box pr={{ base: 0, md: "md" }}>
              <PaperColumn
                title="paper 1"
                entries={paper1}
                selectedIds={selectedIds}
                showSpecCodes={showSpecCodes}
                onToggle={toggle}
                onSelectAll={(select) => selectAllPaper(paper1, select)}
              />
            </Box>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Box pl={{ base: 0, md: "md" }} pt={{ base: "lg", md: 0 }}>
              <PaperColumn
                title="paper 2"
                entries={paper2}
                selectedIds={selectedIds}
                showSpecCodes={showSpecCodes}
                onToggle={toggle}
                onSelectAll={(select) => selectAllPaper(paper2, select)}
              />
            </Box>
          </Grid.Col>
        </Grid>
      </Stack>

      <QuizConfigModal
        opened={configModalOpened}
        onClose={closeConfigModal}
        config={config}
        onConfigChange={setConfig}
        onConfirm={handleGenerate}
        loading={generateQuiz.isPending}
        rearrangeDisabled={rearrangeDisabled}
        conversionsDisabled={conversionsDisabled}
      />
    </Container>
  );
}
