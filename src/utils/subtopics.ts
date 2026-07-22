import type {
  SubtopicEntry,
  SubtopicMeta,
  SubtopicMetaResponse,
  TrancheSelection,
  VariantId,
} from "../api/apiTypes";

const GRID_EQUATION_OVERRIDES: Record<string, string> = {
  efficiency: String.raw`\text{efficiency} = \frac{\text{useful}}{\text{total}}`,
};

/** Shared spec refs (e.g. 4.1.1.2) need an explicit grid order. */
const GRID_TOPIC_ORDER: Record<string, number> = {
  kinetic_energy: 0,
  gravitational_potential_energy: 1,
  elastic_potential_energy: 2,
  elasticity: 0,
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

function specCodeSegments(code: string | undefined): Array<string | number> | null {
  if (!code) return null;
  const parts: Array<string | number> = [];
  for (const token of code.split(".")) {
    const match = /^(\d+)([A-Za-z]*)$/.exec(token);
    if (!match) return null;
    parts.push(Number.parseInt(match[1], 10));
    if (match[2]) parts.push(match[2]);
  }
  return parts.length ? parts : null;
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
    const left = segA[i];
    const right = segB[i];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    if (typeof left === "number" && typeof right === "number") {
      if (left !== right) return left - right;
    } else {
      const diff = String(left).localeCompare(String(right));
      if (diff !== 0) return diff;
    }
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

export type TrancheAvailability = Record<VariantId, boolean>;

/** Display order for custom tranche checkboxes. */
export const TRANCHE_DISPLAY_ORDER: VariantId[] = ["A", "C", "B", "D"];

export const CUSTOM_TRANCHE_OPTIONS: {
  tranche: VariantId;
  label: string;
}[] = [
  { tranche: "A", label: "standard arrangement (no conversions)" },
  { tranche: "C", label: "conversion only" },
  { tranche: "B", label: "rearrangement only" },
  { tranche: "D", label: "both conversion and rearrangement" },
];

const ALL_TRANCHES: VariantId[] = ["A", "B", "C", "D"];

export function emptySelectedTranches(): Record<VariantId, boolean> {
  return { A: false, B: false, C: false, D: false };
}

/**
 * A tranche checkbox is enabled when at least one currently-selected subtopic
 * supports that tranche. With nothing selected, all are disabled.
 */
export function computeTrancheAvailability(
  selectedIds: string[],
  meta: SubtopicMetaResponse,
): TrancheAvailability {
  const availability = emptySelectedTranches();
  for (const id of selectedIds) {
    const entry = meta[id];
    if (!entry) continue;
    for (const tranche of ALL_TRANCHES) {
      if (entry.available_tranches[tranche]) {
        availability[tranche] = true;
      }
    }
  }
  return availability;
}

/** Select the first available tranche in display order. */
export function defaultSelectedTranches(
  availability: TrancheAvailability,
): Record<VariantId, boolean> {
  const selected = emptySelectedTranches();
  const first = TRANCHE_DISPLAY_ORDER.find((tranche) => availability[tranche]);
  if (first) selected[first] = true;
  return selected;
}

/** Keep only available selections; fall back to the first available tranche. */
export function normalizeSelectedTranches(
  current: Record<VariantId, boolean>,
  availability: TrancheAvailability,
): Record<VariantId, boolean> {
  const normalized = emptySelectedTranches();
  let anySelected = false;

  for (const tranche of ALL_TRANCHES) {
    if (current[tranche] && availability[tranche]) {
      normalized[tranche] = true;
      anySelected = true;
    }
  }

  if (!anySelected) {
    return defaultSelectedTranches(availability);
  }
  return normalized;
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

/** Practice modes shown in the new practice set modal. */
export type PracticeMode =
  | "beginner"
  | "standard_progression"
  | "randomised"
  | "custom";

/** Display labels for practice modes (quiz banner + config modal). */
export const PRACTICE_MODE_LABELS: Record<PracticeMode, string> = {
  beginner: "beginner practice",
  standard_progression: "standard practice",
  randomised: "randomised practice",
  custom: "custom practice",
};

/** Build the tranche-selection payload for custom practice. */
export function buildTrancheSelection(
  mode: PracticeMode,
  selectedTranches: Record<VariantId, boolean>,
): TrancheSelection {
  if (mode !== "custom") {
    return { include_rearrangements: false, include_conversions: false };
  }

  const tranches = ALL_TRANCHES.filter((tranche) => selectedTranches[tranche]);
  return {
    include_rearrangements: false,
    include_conversions: false,
    tranches,
  };
}

/** @deprecated Use computeTrancheAvailability */
export interface VariantAvailability {
  rearrangements: boolean;
  conversions: boolean;
}

/** @deprecated Use computeTrancheAvailability */
export function computeVariantAvailability(
  selectedIds: string[],
  meta: SubtopicMetaResponse,
): VariantAvailability {
  const availability = computeTrancheAvailability(selectedIds, meta);
  return {
    rearrangements: availability.B,
    conversions: availability.C,
  };
}

/** @deprecated Use buildTrancheSelection */
export function buildVariantSelection(
  mode: PracticeMode,
  rearrangements: boolean,
  conversions: boolean,
): TrancheSelection {
  if (mode !== "custom") {
    return { include_rearrangements: false, include_conversions: false };
  }
  const selected = emptySelectedTranches();
  selected.A = true;
  if (rearrangements) selected.B = true;
  if (conversions) selected.C = true;
  if (rearrangements && conversions) selected.D = true;
  return buildTrancheSelection(mode, selected);
}
