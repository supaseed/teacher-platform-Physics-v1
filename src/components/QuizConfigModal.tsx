import {
  Button,
  Collapse,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";

import { SquareCheckboxLabel } from "./SquareCheckbox";
import type { VariantId } from "../api/apiTypes";
import type { PracticeMode } from "../utils/subtopics";
import {
  CUSTOM_TRANCHE_OPTIONS,
  normalizeSelectedTranches,
  PRACTICE_MODE_LABELS,
  type TrancheAvailability,
} from "../utils/subtopics";

export interface QuizConfig {
  practiceMode: PracticeMode;
  selectedTranches: Record<VariantId, boolean>;
  questionCount: number;
}

interface QuizConfigModalProps {
  opened: boolean;
  onClose: () => void;
  config: QuizConfig;
  onConfigChange: (config: QuizConfig) => void;
  onConfirm: () => void;
  loading: boolean;
  trancheAvailability: TrancheAvailability;
}

const PRACTICE_OPTIONS: {
  value: PracticeMode;
  label: string;
  description: string;
}[] = [
  {
    value: "beginner",
    label: PRACTICE_MODE_LABELS.beginner,
    description:
      "8 questions not requiring rearrangement or unit conversion",
  },
  {
    value: "standard_progression",
    label: PRACTICE_MODE_LABELS.standard_progression,
    description:
      "8 questions increasing in  difficulty from low demand to high",
  },
  {
    value: "randomised",
    label: PRACTICE_MODE_LABELS.randomised,
    description:
      "8 questions of low and high demand in any order",
  },
  {
    value: "custom",
    label: PRACTICE_MODE_LABELS.custom,
    description:
      "configure level of demand and number of questions",
  },
];

export function QuizConfigModal({
  opened,
  onClose,
  config,
  onConfigChange,
  onConfirm,
  loading,
  trancheAvailability,
}: QuizConfigModalProps) {
  const isCustom = config.practiceMode === "custom";

  const update = (patch: Partial<QuizConfig>) => {
    onConfigChange({ ...config, ...patch });
  };

  const toggleTranche = (tranche: VariantId, checked: boolean) => {
    if (!checked) {
      const selectedCount = Object.entries(config.selectedTranches).filter(
        ([key, value]) => value && trancheAvailability[key as VariantId],
      ).length;
      if (selectedCount <= 1 && config.selectedTranches[tranche]) {
        return;
      }
    }

    update({
      selectedTranches: {
        ...config.selectedTranches,
        [tranche]: checked,
      },
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="lg">
          new practice set
        </Text>
      }
      size="md"
      styles={{
        content: { backgroundColor: "var(--panel-surface)" },
        header: { backgroundColor: "var(--panel-surface)" },
      }}
    >
      <Stack gap="lg">
        <Stack gap="sm">
          <Text className="meta-mono">practice type</Text>
          <Stack gap="xs">
            {PRACTICE_OPTIONS.map((option) => {
              const selected = config.practiceMode === option.value;
              return (
                <UnstyledButton
                  key={option.value}
                  onClick={() => {
                    if (option.value === "custom") {
                      update({
                        practiceMode: "custom",
                        selectedTranches: normalizeSelectedTranches(
                          config.selectedTranches,
                          trancheAvailability,
                        ),
                      });
                      return;
                    }
                    update({ practiceMode: option.value });
                  }}
                  aria-pressed={selected}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.75rem 0.9rem",
                    borderRadius: 8,
                    border: selected
                      ? "2px solid var(--mantine-color-blue-6)"
                      : "1px solid var(--panel-border)",
                    background: selected
                      ? "color-mix(in srgb, var(--mantine-color-blue-6) 10%, transparent)"
                      : "transparent",
                  }}
                >
                  <Text fw={600} size="sm">
                    {option.label}
                  </Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {option.description}
                  </Text>
                </UnstyledButton>
              );
            })}
          </Stack>
        </Stack>

        <Collapse expanded={isCustom}>
          <Stack gap="sm">
            {CUSTOM_TRANCHE_OPTIONS.map(({ tranche, label }) => {
              const available = trancheAvailability[tranche];
              return (
                <SquareCheckboxLabel
                  key={tranche}
                  label={label}
                  disabled={!available}
                  checked={available && config.selectedTranches[tranche]}
                  onChange={(checked) => toggleTranche(tranche, checked)}
                />
              );
            })}
            <NumberInput
              label={
                <Text className="meta-mono">number of questions (1-50)</Text>
              }
              value={config.questionCount}
              onChange={(value) => {
                const n = typeof value === "number" ? value : Number(value);
                if (!Number.isNaN(n)) {
                  update({ questionCount: Math.min(50, Math.max(1, n)) });
                }
              }}
              min={1}
              max={50}
              clampBehavior="strict"
              styles={{
                input: { borderColor: "var(--panel-border)" },
              }}
            />
          </Stack>
        </Collapse>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={onClose}
            style={{ borderColor: "var(--panel-border)" }}
          >
            cancel
          </Button>
          <Button onClick={onConfirm} loading={loading} className="btn-ready">
            generate set
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
