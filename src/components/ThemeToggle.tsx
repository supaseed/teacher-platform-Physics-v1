import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={() => toggleColorScheme()}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        border: "1px solid var(--panel-border)",
        backgroundColor: "var(--panel-surface)",
        color: "var(--panel-text)",
      }}
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}
