import type { SubtopicEntry } from "../api/apiTypes";
import { Katex } from "./Katex";
import { SquareCheckbox } from "./SquareCheckbox";

interface SubtopicCardProps {
  entry: SubtopicEntry;
  selected: boolean;
  showSpecCode: boolean;
  onToggle: (id: string) => void;
}

export function SubtopicCard({
  entry,
  selected,
  showSpecCode,
  onToggle,
}: SubtopicCardProps) {
  return (
    <div
      className="topic-tile"
      data-selected={selected ? "true" : "false"}
      onClick={() => onToggle(entry.id)}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle(entry.id);
        }
      }}
    >
      <div className="topic-tile__checkbox-row">
        <SquareCheckbox
          checked={selected}
          onChange={() => onToggle(entry.id)}
          aria-label={`Select ${entry.display_name}`}
        />
        <span className="topic-tile__name">{entry.display_name}</span>
      </div>
      <div className="topic-tile__equation">
        <Katex math={entry.equation_latex} />
      </div>
      {showSpecCode && entry.spec_code ? (
        <span className="topic-tile__spec">{entry.spec_code}</span>
      ) : null}
    </div>
  );
}
