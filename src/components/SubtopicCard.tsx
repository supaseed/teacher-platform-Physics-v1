import { memo } from "react";

import type { SubtopicEntry } from "../api/apiTypes";
import { Katex } from "./Katex";
import { SquareCheckbox } from "./SquareCheckbox";

interface SubtopicCardProps {
  entry: SubtopicEntry;
  selected: boolean;
  disabled?: boolean;
  higherOnly?: boolean;
  onToggle: (id: string) => void;
}

export const SubtopicCard = memo(function SubtopicCard({
  entry,
  selected,
  disabled = false,
  higherOnly = false,
  onToggle,
}: SubtopicCardProps) {
  const handleToggle = () => {
    if (disabled) return;
    onToggle(entry.id);
  };

  return (
    <div
      className="topic-tile"
      data-selected={selected ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      onClick={handleToggle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle(entry.id);
        }
      }}
    >
      {higherOnly ? <span className="topic-tile__badge">H</span> : null}
      <div className="topic-tile__checkbox-row">
        <SquareCheckbox
          checked={selected}
          disabled={disabled}
          onChange={handleToggle}
          aria-label={`Select ${entry.display_name}`}
        />
        <span className="topic-tile__name">{entry.display_name}</span>
      </div>
      <div className="topic-tile__equation">
        <Katex math={entry.equation_latex} />
      </div>
      {entry.spec_code ? (
        <span className="topic-tile__spec">{entry.spec_code}</span>
      ) : null}
    </div>
  );
});
