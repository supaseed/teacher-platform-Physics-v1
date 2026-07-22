import { useCallback, useMemo, useRef, useState } from "react";
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
import { DisplayPreferencesBar } from "../components/DisplayPreferencesBar";
import { SquareCheckbox } from "../components/SquareCheckbox";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  QuizConfigModal,
  type QuizConfig,
} from "../components/QuizConfigModal";
import {
  buildTrancheSelection,
  computeTrancheAvailability,
  normalizeSelectedTranches,
  selectedTopicKeys,
  toEntries,
} from "../utils/subtopics";
import {
  countSelectable,
  enrichForDisplay,
  loadStoredDisplayContext,
  splitByPaperForDisplay,
  storeDisplayContext,
  type DisplayableEntry,
} from "../utils/displayContext";
import type { DisplayContext } from "../api/apiTypes";
import { loadStoredFontPreset } from "../utils/questionFontSize";

const DEFAULT_CONFIG: QuizConfig = {
  practiceMode: "standard_progression",
  selectedTranches: { A: true, B: false, C: false, D: false },
  questionCount: 8,
};

function PaperColumn({
  title,
  entries,
  selectedIds,
  onToggle,
  onSelectAll,
}: {
  title: string;
  entries: DisplayableEntry[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: (select: boolean) => void;
}) {
  const selectableEntries = entries.filter((e) => e.selectable);
  const selectedCount = selectableEntries.filter((e) =>
    selectedIds.includes(e.id),
  ).length;
  const allSelected =
    selectableEntries.length > 0 &&
    selectedCount === selectableEntries.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <Stack gap="sm" h="100%">
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          <SquareCheckbox
            checked={allSelected}
            indeterminate={someSelected}
            disabled={selectableEntries.length === 0}
            onChange={() => onSelectAll(!allSelected)}
            aria-label={`Select all ${title} equations`}
          />
          <Title order={3} style={{ display: "inline-flex", alignItems: "center" }}>
            <span className="section-accent-bar" />
            {title}
          </Title>
        </Group>
        <Text className="meta-mono">
          {countSelectable(entries)}/{entries.length} eq
        </Text>
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
              disabled={!entry.selectable}
              higherOnly={entry.higherOnly}
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
  const { startNewQuiz, setPreferences, preferences } = useQuiz();
  const { data: meta, isLoading, isError, error, refetch } = useSubtopicMeta();
  const generateQuiz = useGenerateQuiz();
  const [configModalOpened, { open: openConfigModal, close: closeConfigModal }] =
    useDisclosure(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [config, setConfig] = useState<QuizConfig>(DEFAULT_CONFIG);
  const [draftContext, setDraftContext] = useState<DisplayContext>(
    loadStoredDisplayContext,
  );
  const [appliedContext, setAppliedContext] = useState<DisplayContext>(
    loadStoredDisplayContext,
  );

  const allEntries = useMemo(
    () => (meta ? toEntries(meta) : []),
    [meta],
  );

  const displayEntries = useMemo(
    () => enrichForDisplay(allEntries, appliedContext),
    [allEntries, appliedContext],
  );

  const { paper1, paper2 } = useMemo(
    () => splitByPaperForDisplay(displayEntries, appliedContext),
    [displayEntries, appliedContext],
  );

  const trancheAvailability = useMemo(
    () =>
      meta
        ? computeTrancheAvailability(selectedIds, meta)
        : { A: false, B: false, C: false, D: false },
    [selectedIds, meta],
  );

  const selectableSelectedCount = useMemo(() => {
    const selectableIds = new Set(
      displayEntries.filter((e) => e.selectable).map((e) => e.id),
    );
    return selectedIds.filter((id) => selectableIds.has(id)).length;
  }, [displayEntries, selectedIds]);

  const displayEntriesRef = useRef(displayEntries);
  displayEntriesRef.current = displayEntries;

  const applyDisplayPreferences = useCallback(() => {
    setAppliedContext({ ...draftContext });
    storeDisplayContext(draftContext);
  }, [draftContext]);

  const toggleSelectable = useCallback((id: string) => {
    const entry = displayEntriesRef.current.find((e) => e.id === id);
    if (entry && !entry.selectable) return;

    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllPaper = (entries: DisplayableEntry[], select: boolean) => {
    const ids = entries.filter((e) => e.selectable).map((e) => e.id);
    setSelectedIds((prev) => {
      if (select) {
        return [...new Set([...prev, ...ids])];
      }
      const idSet = new Set(ids);
      return prev.filter((id) => !idSet.has(id));
    });
  };

  const handleReadyClick = () => {
    if (selectableSelectedCount === 0) {
      notifications.show({
        color: "orange",
        message: "Select at least one available equation first.",
      });
      return;
    }
    setConfig((prev) => ({
      ...prev,
      selectedTranches: normalizeSelectedTranches(
        prev.selectedTranches,
        trancheAvailability,
      ),
    }));
    openConfigModal();
  };

  const handleGenerate = () => {
    if (!meta || selectableSelectedCount === 0) return;

    const selectableIds = displayEntries
      .filter((e) => e.selectable && selectedIds.includes(e.id))
      .map((e) => e.id);

    const trancheSelection = buildTrancheSelection(
      config.practiceMode,
      config.selectedTranches,
    );
    const topics = selectedTopicKeys(selectableIds, meta);
    const isPreset =
      config.practiceMode === "beginner" ||
      config.practiceMode === "standard_progression" ||
      config.practiceMode === "randomised";

    if (
      config.practiceMode === "custom" &&
      (!trancheSelection.tranches || trancheSelection.tranches.length === 0)
    ) {
      notifications.show({
        color: "orange",
        message: "Select at least one question type for custom practice.",
      });
      return;
    }

    generateQuiz.mutate(
      {
        topics,
        tranche_selection: trancheSelection,
        include_answer: true,
        include_formula: true,
        count: isPreset ? 8 : config.questionCount,
        quiz_mode: config.practiceMode,
        display_context: appliedContext,
      },
      {
        onSuccess: (data) => {
          storeDisplayContext(appliedContext);
          startNewQuiz(data.questions, config.practiceMode);
          setPreferences({
            ...preferences,
            questionFontPreset: loadStoredFontPreset(),
            displayContext: appliedContext,
          });
          closeConfigModal();
          navigate("/quiz");
        },
        onError: (err) => {
          notifications.show({
            color: "red",
            title: "Could not generate set",
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
              Choose from the equations below to instantly generate your own unique practice set.
            </Text>
          </Box>
          <Group gap="sm" align="center">
            <Button
              size="lg"
              className="btn-ready"
              onClick={handleReadyClick}
              disabled={selectableSelectedCount === 0}
            >
              ready?
            </Button>
            <ThemeToggle />
          </Group>
        </Group>

        <DisplayPreferencesBar
          draft={draftContext}
          applied={appliedContext}
          onDraftChange={setDraftContext}
          onApply={applyDisplayPreferences}
        />

        <Group justify="flex-end" align="center">
          <Text className="meta-mono">
            {selectableSelectedCount} selected
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
                onToggle={toggleSelectable}
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
                onToggle={toggleSelectable}
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
        trancheAvailability={trancheAvailability}
      />
    </Container>
  );
}
