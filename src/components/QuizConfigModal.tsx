import {
  Button,
  Collapse,
  Divider,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { useMantineColorScheme } from "@mantine/core";

import { SquareCheckboxLabel } from "./SquareCheckbox";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle";
import type { QuestionTypeMode } from "../utils/subtopics";

export interface QuizConfig {
  questionTypeMode: QuestionTypeMode;
  rearrangements: boolean;
  conversions: boolean;
  questionCount: number;
  viewMode: ViewMode;
  generatePdf: boolean;
}

interface QuizConfigModalProps {
  opened: boolean;
  onClose: () => void;
  config: QuizConfig;
  onConfigChange: (config: QuizConfig) => void;
  onConfirm: () => void;
  loading: boolean;
  rearrangeDisabled: boolean;
  conversionsDisabled: boolean;
}

export function QuizConfigModal({
  opened,
  onClose,
  config,
  onConfigChange,
  onConfirm,
  loading,
  rearrangeDisabled,
  conversionsDisabled,
}: QuizConfigModalProps) {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isVariants = config.questionTypeMode === "variants";

  const update = (patch: Partial<QuizConfig>) => {
    onConfigChange({ ...config, ...patch });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={700} size="lg">
          quiz settings
        </Text>
      }
      size="md"
      styles={{
        content: { backgroundColor: "var(--panel-surface)" },
        header: { backgroundColor: "var(--panel-surface)" },
      }}
    >
      <Stack gap="lg">
        <Stack gap={4}>
          <Text className="meta-mono">question type</Text>
          <SegmentedControl
            value={config.questionTypeMode}
            onChange={(value) => {
              if (value === "standard" || value === "variants") {
                update({ questionTypeMode: value });
              }
            }}
            data={[
              { label: "standard", value: "standard" },
              { label: "variants", value: "variants" },
            ]}
            fullWidth
            styles={{
              root: { border: "1px solid var(--panel-border)" },
            }}
          />
        </Stack>

        <Collapse expanded={isVariants}>
          <Stack gap="sm">
            <SquareCheckboxLabel
              label="may require rearrangement"
              disabled={rearrangeDisabled}
              checked={!rearrangeDisabled && config.rearrangements}
              onChange={(checked) => update({ rearrangements: checked })}
            />
            <SquareCheckboxLabel
              label="may require unit conversions"
              disabled={conversionsDisabled}
              checked={!conversionsDisabled && config.conversions}
              onChange={(checked) => update({ conversions: checked })}
            />
          </Stack>
        </Collapse>

        <Divider color="var(--panel-border)" />

        <NumberInput
          label={<Text className="meta-mono">number of questions</Text>}
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

        <Stack gap="sm">
          <Text className="meta-mono">output</Text>
          <Switch
            label="generate pdf after quiz loads"
            checked={config.generatePdf}
            onChange={(e) => update({ generatePdf: e.currentTarget.checked })}
            styles={{
              track: { border: "1px solid var(--panel-border)" },
            }}
          />
          <Group justify="space-between" align="center">
            <Text size="sm">view mode</Text>
            <ViewModeToggle
              value={config.viewMode}
              onChange={(viewMode) => update({ viewMode })}
            />
          </Group>
          <Group justify="space-between" align="center">
            <Text size="sm">theme</Text>
            <SegmentedControl
              value={colorScheme}
              onChange={(value) => {
                if (value === "light" || value === "dark") {
                  setColorScheme(value);
                }
              }}
              data={[
                { label: "light", value: "light" },
                { label: "dark", value: "dark" },
              ]}
              styles={{
                root: { border: "1px solid var(--panel-border)" },
              }}
            />
          </Group>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button
            variant="default"
            onClick={onClose}
            style={{ borderColor: "var(--panel-border)" }}
          >
            cancel
          </Button>
          <Button onClick={onConfirm} loading={loading} className="btn-ready">
            generate quiz
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
