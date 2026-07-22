import {
  Group,
  SegmentedControl,
  Stack,
  Text,
  Button,
} from "@mantine/core";

import type { DisplayContext, ExamBoardId, PathwayId, TierId } from "../api/apiTypes";
import { displayContextsEqual } from "../utils/displayContext";

interface DisplayPreferencesBarProps {
  draft: DisplayContext;
  applied: DisplayContext;
  onDraftChange: (next: DisplayContext) => void;
  onApply: () => void;
}

const BOARD_OPTIONS = [
  { label: "AQA", value: "aqa" },
  { label: "OCR", value: "ocr" },
  { label: "Edexcel", value: "edexcel" },
];

const PATHWAY_OPTIONS = [
  { label: "Separate", value: "separate" },
  { label: "Combined", value: "combined" },
];

const TIER_OPTIONS = [
  { label: "Foundation", value: "foundation" },
  { label: "Higher", value: "higher" },
];

export function DisplayPreferencesBar({
  draft,
  applied,
  onDraftChange,
  onApply,
}: DisplayPreferencesBarProps) {
  const hasPendingChanges = !displayContextsEqual(draft, applied);

  return (
    <Stack
      gap="sm"
      p="md"
      className="panel-surface"
      style={{ border: "1px solid var(--panel-border)" }}
    >
      <Group justify="space-between" align="center" wrap="wrap">
        <Text className="meta-mono">display preferences</Text>
        <Button
          size="xs"
          className={hasPendingChanges ? "btn-ready" : undefined}
          variant={hasPendingChanges ? "filled" : "default"}
          onClick={onApply}
          disabled={!hasPendingChanges}
          style={
            hasPendingChanges
              ? undefined
              : { borderColor: "var(--panel-border)" }
          }
        >
          update
        </Button>
      </Group>

      <Group gap="lg" wrap="wrap" align="flex-end">
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            exam board
          </Text>
          <SegmentedControl
            value={draft.board}
            onChange={(value) =>
              onDraftChange({ ...draft, board: value as ExamBoardId })
            }
            data={BOARD_OPTIONS}
            size="xs"
          />
        </Stack>

        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            pathway
          </Text>
          <SegmentedControl
            value={draft.pathway}
            onChange={(value) =>
              onDraftChange({ ...draft, pathway: value as PathwayId })
            }
            data={PATHWAY_OPTIONS}
            size="xs"
          />
        </Stack>

        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            tier
          </Text>
          <SegmentedControl
            value={draft.tier}
            onChange={(value) =>
              onDraftChange({ ...draft, tier: value as TierId })
            }
            data={TIER_OPTIONS}
            size="xs"
          />
        </Stack>
      </Group>
    </Stack>
  );
}
