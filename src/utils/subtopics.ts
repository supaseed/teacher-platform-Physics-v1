import type {
  SubtopicEntry,
  SubtopicMeta,
  SubtopicMetaResponse,
  TrancheSelection,
} from "../api/apiTypes";

const GRID_EQUATION_OVERRIDES: Record<string, string> = {
  efficiency: String.raw`\text{efficiency} = \frac{\text{useful}}{\text{total}}`,
};

/** Shared spec refs (e.g. 4.1.1.2) need an explicit grid order. */
const GRID_TOPIC_ORDER: Record<string, number> = {
  kinetic_energy: 0,
  gravitational_potential_energy: 1,
  elastic_potential_energy: 2,
};

function gridEquationLatex(entry: SubtopicMeta): string {
  return GRID_EQUATION_OVERRIDES[entry.topic_key] ?? entry.equation_latex;
}

function gridTopicRank(topicKey: string): number {
  return GRID_TOPIC_ORDER[topicKey] ?? Number.MAX_SAFE_INTEGER;
}

/** Convert the id->meta map into a flat array of entries. */
export function toEntries(meta: SubtopicMetaResponse): SubtopicEntry[] {
  return Object.entries(meta).map(([id, value]) => ({
    id,
    ...value,
    equation_latex: gridEquationLatex(value),
  }));
}

function specCodeSegments(code: string | undefined): number[] | null {
  if (!code) return null;
  const parts = code.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  return parts;
}

/** Sort by AQA spec reference ascending; entries without one go last. */
function compareSpecCodes(a: SubtopicEntry, b: SubtopicEntry): number {
  const segA = specCodeSegments(a.spec_code);
  const segB = specCodeSegments(b.spec_code);

  if (segA === null && segB === null) {
    return a.display_name.localeCompare(b.display_name);
  }
  if (segA === null) return 1;
  if (segB === null) return -1;

  const len = Math.max(segA.length, segB.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (segA[i] ?? 0) - (segB[i] ?? 0);
    if (diff !== 0) return diff;
  }

  const rankA = gridTopicRank(a.topic_key);
  const rankB = gridTopicRank(b.topic_key);
  if (rankA !== rankB) return rankA - rankB;

  return a.display_name.localeCompare(b.display_name);
}

/** Split entries into the two paper columns, sorted by spec reference. */
export function splitByPaper(entries: SubtopicEntry[]): {
  paper1: SubtopicEntry[];
  paper2: SubtopicEntry[];
} {
  const sort = (list: SubtopicEntry[]) => [...list].sort(compareSpecCodes);

  return {
    paper1: sort(entries.filter((e) => e.paper === 1)),
    paper2: sort(entries.filter((e) => e.paper === 2)),
  };
}

export interface VariantAvailability {
  /** True when at least one selected subtopic supports rearrangement variants. */
  rearrangements: boolean;
  /** True when at least one selected subtopic supports unit-conversion variants. */
  conversions: boolean;
}

/**
 * A variant checkbox is enabled when at least one currently-selected subtopic
 * supports that variant type. With nothing selected, both are disabled.
 */
export function computeVariantAvailability(
  selectedIds: string[],
  meta: SubtopicMetaResponse,
): VariantAvailability {
  let rearrangements = false;
  let conversions = false;
  for (const id of selectedIds) {
    const entry = meta[id];
    if (!entry) continue;
    if (entry.available_tranches.B) rearrangements = true;
    if (entry.available_tranches.C) conversions = true;
  }
  return { rearrangements, conversions };
}

/**
 * Map selected spec IDs (e.g. "4113_thermal_energy") to the unique engine
 * topic keys (e.g. "specific_heat_capacity") that POST /generate-quiz expects.
 *
 * The same equation can surface under multiple spec IDs (once per paper), so we
 * dedupe by topic_key to avoid double-weighting a topic in the generator.
 */
export function selectedTopicKeys(
  selectedIds: string[],
  meta: SubtopicMetaResponse,
): string[] {
  const keys = new Set<string>();
  for (const id of selectedIds) {
    const entry = meta[id];
    if (entry?.topic_key) keys.add(entry.topic_key);
  }
  return [...keys];
}

export type QuestionTypeMode = "standard" | "variants";

/**
 * Build the variant-selection payload from the UI controls.
 * In "standard" mode only direct questions are used (both flags false).
 */
export function buildVariantSelection(
  mode: QuestionTypeMode,
  rearrangements: boolean,
  conversions: boolean,
): TrancheSelection {
  if (mode === "standard") {
    return { include_rearrangements: false, include_conversions: false };
  }
  return {
    include_rearrangements: rearrangements,
    include_conversions: conversions,
  };
}
