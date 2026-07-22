import { ActionIcon, Group, Text } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";

import {
  QUESTION_FONT_PRESET_ORDER,
  QUESTION_FONT_PRESETS,
  type QuestionFontPreset,
} from "../utils/questionFontSize";

interface QuestionFontControlsProps {
  preset: QuestionFontPreset;
  onPresetChange: (preset: QuestionFontPreset) => void;
}

export function QuestionFontControls({
  preset,
  onPresetChange,
}: QuestionFontControlsProps) {
  const index = QUESTION_FONT_PRESET_ORDER.indexOf(preset);
  const canDecrease = index > 0;
  const canIncrease = index < QUESTION_FONT_PRESET_ORDER.length - 1;

  return (
    <Group gap={6} wrap="nowrap" className="font-size-controls" align="center">
      <Text className="font-size-controls__label meta-mono">text size</Text>
      <ActionIcon
        variant="default"
        size="md"
        aria-label="smaller question text"
        disabled={!canDecrease}
        onClick={() =>
          onPresetChange(
            QUESTION_FONT_PRESET_ORDER[index - 1] as QuestionFontPreset,
          )
        }
        style={{
          borderColor: "var(--panel-border)",
          color: "var(--panel-text)",
        }}
      >
        <IconMinus size={14} />
      </ActionIcon>
      <Text className="font-size-controls__value">
        {QUESTION_FONT_PRESETS[preset].label}
      </Text>
      <ActionIcon
        variant="default"
        size="md"
        aria-label="larger question text"
        disabled={!canIncrease}
        onClick={() =>
          onPresetChange(
            QUESTION_FONT_PRESET_ORDER[index + 1] as QuestionFontPreset,
          )
        }
        style={{
          borderColor: "var(--panel-border)",
          color: "var(--panel-text)",
        }}
      >
        <IconPlus size={14} />
      </ActionIcon>
    </Group>
  );
}
