import { SegmentedControl } from "@mantine/core";

export type ViewMode = "list" | "single";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

/**
 * Controlled List/Single toggle with an explicit handler so Mantine's
 * SegmentedControl never leaves view state in an invalid intermediate value.
 */
export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <SegmentedControl
      value={value}
      onChange={(next) => {
        if (next === "list" || next === "single") {
          onChange(next);
        }
      }}
      data={[
        { label: "list", value: "list" },
        { label: "single", value: "single" },
      ]}
      styles={{
        root: { border: "1px solid var(--panel-border)" },
      }}
    />
  );
}
