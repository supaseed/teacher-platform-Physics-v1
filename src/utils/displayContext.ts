import type {
  BoardTopicMeta,
  DisplayContext,
  ExamBoardId,
  PathwayId,
  SelectorPlacement,
  SubtopicEntry,
  TierId,
  TopicPresentation,
} from "../api/apiTypes";
import localBoardTopics from "../data/board_topics.json";

export const DEFAULT_DISPLAY_CONTEXT: DisplayContext = {
  board: "aqa",
  pathway: "separate",
  tier: "higher",
};

/** Fresh copy so draft/applied state never share one object. */
export function createDefaultDisplayContext(): DisplayContext {
  return { ...DEFAULT_DISPLAY_CONTEXT };
}

const DISPLAY_CONTEXT_STORAGE_KEY = "display-context";

const VALID_BOARDS: ExamBoardId[] = ["aqa", "ocr", "edexcel"];
const VALID_PATHWAYS: PathwayId[] = ["separate", "combined"];
const VALID_TIERS: TierId[] = ["foundation", "higher"];

function isExamBoardId(value: string): value is ExamBoardId {
  return VALID_BOARDS.includes(value as ExamBoardId);
}

function isPathwayId(value: string): value is PathwayId {
  return VALID_PATHWAYS.includes(value as PathwayId);
}

function isTierId(value: string): value is TierId {
  return VALID_TIERS.includes(value as TierId);
}

function isDisplayContext(value: unknown): value is DisplayContext {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.board === "string" &&
    isExamBoardId(obj.board) &&
    typeof obj.pathway === "string" &&
    isPathwayId(obj.pathway) &&
    typeof obj.tier === "string" &&
    isTierId(obj.tier)
  );
}

export function loadStoredDisplayContext(): DisplayContext {
  try {
    const stored = sessionStorage.getItem(DISPLAY_CONTEXT_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (isDisplayContext(parsed)) {
        return { ...parsed };
      }
    }
  } catch {
    /* ignore storage errors */
  }
  return createDefaultDisplayContext();
}

export function storeDisplayContext(ctx: DisplayContext): void {
  try {
    sessionStorage.setItem(DISPLAY_CONTEXT_STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Topics awaiting board metadata — omitted from the selector until
 * spreadsheet rows are added and re-imported.
 */
export const PENDING_METADATA_TOPIC_KEYS = new Set([
  "half_lives",
  "circuit_current",
  "circuit_pd",
  "period",
]);

export function isPendingMetadataTopic(topicKey: string): boolean {
  return PENDING_METADATA_TOPIC_KEYS.has(topicKey);
}

type LocalBoardTopics = Record<string, Partial<Record<ExamBoardId, BoardTopicMeta>>>;

const LOCAL_BOARD_TOPICS = localBoardTopics as LocalBoardTopics;

/** Prefer API boards when present; otherwise use the local imported spreadsheet. */
export function resolveBoardsForEntry(
  entry: SubtopicEntry,
): Partial<Record<ExamBoardId, BoardTopicMeta>> | undefined {
  const fromApi = entry.boards;
  if (fromApi && Object.keys(fromApi).length > 0) {
    return fromApi;
  }
  return LOCAL_BOARD_TOPICS[entry.topic_key];
}

export function displayContextsEqual(
  a: DisplayContext,
  b: DisplayContext,
): boolean {
  return a.board === b.board && a.pathway === b.pathway && a.tier === b.tier;
}

function boardMeta(
  entry: SubtopicEntry,
  board: ExamBoardId,
): BoardTopicMeta | undefined {
  return resolveBoardsForEntry(entry)?.[board];
}

/**
 * Board-only alternate selector entries are hidden on other exam boards.
 */
export function isVisibleForBoard(
  entry: SubtopicEntry,
  ctx: DisplayContext,
): boolean {
  const placement = entry.selector_placement;
  if (placement?.aqa_only && ctx.board !== "aqa") {
    return false;
  }
  if (placement?.ocr_only && ctx.board !== "ocr") {
    return false;
  }
  if (placement?.edexcel_only && ctx.board !== "edexcel") {
    return false;
  }
  return true;
}

/**
 * True when the topic appears on the active board + pathway at foundation
 * and/or higher. Topics missing from the board or pathway are omitted.
 */
export function isOnActivePathway(
  entry: SubtopicEntry,
  ctx: DisplayContext,
): boolean {
  if (isPendingMetadataTopic(entry.topic_key)) return false;
  if (!isVisibleForBoard(entry, ctx)) return false;

  const meta = boardMeta(entry, ctx.board);
  const pathway = meta?.availability?.[ctx.pathway];
  if (!pathway) return false;

  return pathway.foundation === true || pathway.higher === true;
}

/** Selectable for the currently applied tier. */
export function isAvailable(
  entry: SubtopicEntry,
  ctx: DisplayContext,
): boolean {
  if (!isOnActivePathway(entry, ctx)) return false;
  const meta = boardMeta(entry, ctx.board);
  return meta!.availability[ctx.pathway]?.[ctx.tier] === true;
}

/** True when available at higher but not foundation for the active pathway. */
export function isHigherOnly(
  entry: SubtopicEntry,
  ctx: DisplayContext,
): boolean {
  const meta = boardMeta(entry, ctx.board);
  const pathway = meta?.availability?.[ctx.pathway];
  if (!pathway) return false;
  return pathway.higher === true && pathway.foundation !== true;
}

function pickPresentation(
  pathwayBlock: Partial<Record<"foundation" | "higher", TopicPresentation>> | undefined,
  tier: "foundation" | "higher",
): TopicPresentation | undefined {
  if (!pathwayBlock) return undefined;
  return (
    pathwayBlock[tier] ??
    pathwayBlock.higher ??
    pathwayBlock.foundation
  );
}

function applySelectorPlacement(
  base: TopicPresentation,
  placement: SelectorPlacement,
): TopicPresentation {
  return {
    ...base,
    spec_code: placement.spec_code ?? base.spec_code,
    paper: placement.paper ?? base.paper,
    sort_key: placement.sort_key ?? base.sort_key,
    equation_latex: placement.equation_latex ?? base.equation_latex,
  };
}

export function resolvePresentation(
  entry: SubtopicEntry,
  ctx: DisplayContext,
): TopicPresentation | null {
  const meta = boardMeta(entry, ctx.board);
  const pathwayBlock = meta?.presentations?.[ctx.pathway];
  const tierPresentation = pickPresentation(pathwayBlock, ctx.tier);
  const placement = entry.selector_placement;

  if (tierPresentation) {
    let presentation: TopicPresentation = {
      spec_code: tierPresentation.spec_code ?? entry.spec_code,
      paper: tierPresentation.paper ?? entry.paper,
      sort_key: tierPresentation.sort_key,
      equation_latex:
        tierPresentation.equation_latex ?? entry.equation_latex,
      word_equation: tierPresentation.word_equation,
      equation_ref: tierPresentation.equation_ref,
    };

    if (placement && shouldApplyPlacement(placement, ctx.board)) {
      presentation = applySelectorPlacement(presentation, placement);
    }

    return presentation;
  }

  // Legacy fallback for AQA separate higher when no board metadata exists.
  if (
    ctx.board === "aqa" &&
    ctx.pathway === "separate" &&
    ctx.tier === "higher"
  ) {
    const presentation: TopicPresentation = {
      spec_code: entry.spec_code,
      paper: entry.paper,
      equation_latex: entry.equation_latex,
    };
    if (placement && shouldApplyPlacement(placement, ctx.board)) {
      return applySelectorPlacement(presentation, placement);
    }
    return presentation;
  }

  return null;
}

function shouldApplyPlacement(
  placement: SelectorPlacement,
  board: ExamBoardId,
): boolean {
  if (placement.aqa_only) return board === "aqa";
  if (placement.ocr_only) return board === "ocr";
  if (placement.edexcel_only) return board === "edexcel";
  // Legacy AQA filename placements without an explicit only-flag.
  return board === "aqa";
}

function resolveDisplayName(
  entry: SubtopicEntry,
  ctx: DisplayContext,
): string {
  const placement = entry.selector_placement;
  if (placement?.display_name && shouldApplyPlacement(placement, ctx.board)) {
    return placement.display_name;
  }
  return entry.display_name;
}

function compareSortKeys(a: unknown[] | undefined, b: unknown[] | undefined): number {
  if (!a?.length && !b?.length) return 0;
  if (!a?.length) return 1;
  if (!b?.length) return -1;

  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    if (typeof left === "number" && typeof right === "number") {
      if (left !== right) return left - right;
    } else {
      const diff = String(left).localeCompare(String(right));
      if (diff !== 0) return diff;
    }
  }
  return 0;
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

/** Grid tie-break when board sort_key and spec_code match (e.g. 4.5.3). */
const TOPIC_TIE_ORDER: Record<string, number> = {
  kinetic_energy: 0,
  gravitational_potential_energy: 1,
  elastic_potential_energy: 2,
  elasticity: 0,
};

function compareLegacySpecCodes(a: SubtopicEntry, b: SubtopicEntry): number {
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
  return a.display_name.localeCompare(b.display_name);
}

/** Sort entries by the active board/pathway/tier presentation order. */
export function compareForDisplayContext(
  a: SubtopicEntry,
  b: SubtopicEntry,
  ctx: DisplayContext,
): number {
  const presA = resolvePresentation(a, ctx);
  const presB = resolvePresentation(b, ctx);

  const sortDiff = compareSortKeys(presA?.sort_key, presB?.sort_key);
  if (sortDiff !== 0) return sortDiff;

  if (presA?.spec_code && presB?.spec_code) {
    const segA = specCodeSegments(presA.spec_code);
    const segB = specCodeSegments(presB.spec_code);
    if (segA && segB) {
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
    } else {
      const diff = presA.spec_code.localeCompare(presB.spec_code);
      if (diff !== 0) return diff;
    }
  }

  const rankA = TOPIC_TIE_ORDER[a.topic_key] ?? Number.MAX_SAFE_INTEGER;
  const rankB = TOPIC_TIE_ORDER[b.topic_key] ?? Number.MAX_SAFE_INTEGER;
  if (rankA !== rankB) return rankA - rankB;

  return compareLegacySpecCodes(a, b);
}

export interface DisplayableEntry extends SubtopicEntry {
  presentation: TopicPresentation | null;
  selectable: boolean;
  higherOnly: boolean;
}

/**
 * Filter to the active board + pathway, then attach presentation and
 * availability. Higher-only topics stay visible (greyed) on Foundation.
 */
export function enrichForDisplay(
  entries: SubtopicEntry[],
  ctx: DisplayContext,
): DisplayableEntry[] {
  return entries
    .filter((entry) => isOnActivePathway(entry, ctx))
    .map((entry) => {
      const presentation = resolvePresentation(entry, ctx);
      const display_name = resolveDisplayName(entry, ctx);
      return {
        ...entry,
        display_name,
        boards: resolveBoardsForEntry(entry),
        presentation,
        selectable: isAvailable(entry, ctx),
        higherOnly: isHigherOnly(entry, ctx),
        equation_latex: presentation?.equation_latex ?? entry.equation_latex,
        spec_code: presentation?.spec_code ?? entry.spec_code,
        paper: presentation?.paper ?? entry.paper,
      };
    });
}

export function splitByPaperForDisplay(
  entries: DisplayableEntry[],
  ctx: DisplayContext,
): { paper1: DisplayableEntry[]; paper2: DisplayableEntry[] } {
  const sorted = [...entries].sort((a, b) =>
    compareForDisplayContext(a, b, ctx),
  );

  return {
    paper1: sorted.filter((e) => Number(e.presentation?.paper ?? e.paper) === 1),
    paper2: sorted.filter((e) => Number(e.presentation?.paper ?? e.paper) === 2),
  };
}

export function countSelectable(entries: DisplayableEntry[]): number {
  return entries.filter((e) => e.selectable).length;
}
