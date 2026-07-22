// Manually-defined TypeScript types that mirror the FastAPI backend contracts.
// Keep these strict: no `any`.

/** Which paper a subtopic belongs to. */
export type PaperNumber = 1 | 2;

export type ExamBoardId = "aqa" | "ocr" | "edexcel";
export type PathwayId = "separate" | "combined";
export type TierId = "foundation" | "higher";

export interface DisplayContext {
  board: ExamBoardId;
  pathway: PathwayId;
  tier: TierId;
}

/** Per-tier presentation metadata within a pathway. */
export interface TopicPresentation {
  spec_code?: string;
  paper?: PaperNumber;
  sort_key?: Array<string | number>;
  equation_latex?: string;
  word_equation?: string;
  equation_ref?: string;
}

/** Selector placement override for multi-spec / alternate equation tiles. */
export interface SelectorPlacement {
  display_name?: string;
  spec_code?: string;
  paper?: PaperNumber;
  sort_key?: Array<string | number>;
  equation_latex?: string;
  /** When true the selector entry is omitted unless the active board is AQA. */
  aqa_only?: boolean;
  /** When true the selector entry is omitted unless the active board is OCR. */
  ocr_only?: boolean;
  /** When true the selector entry is omitted unless the active board is Edexcel. */
  edexcel_only?: boolean;
}

/** Availability matrix for one exam board on a topic. */
export interface BoardTopicMeta {
  availability: Record<PathwayId, Partial<Record<TierId, boolean>>>;
  presentations?: Partial<
    Record<PathwayId, Partial<Record<TierId, TopicPresentation>>>
  >;
}

/** The four variant identifiers used by the generator API (A–D). */
export type VariantId = "A" | "B" | "C" | "D";

/** Availability flags for each question variant of a given subtopic. */
export type AvailableTranches = Record<VariantId, boolean>;

/** A single subtopic entry as returned by GET /subtopic-meta. */
export interface SubtopicMeta {
  /** Engine topic key (e.g. "charge_flow") to send to POST /generate-quiz. */
  topic_key: string;
  display_name: string;
  equation_latex: string;
  paper: PaperNumber;
  /** AQA spec reference, e.g. "4.1.1.2". May be missing on some entries. */
  spec_code?: string;
  available_tranches: AvailableTranches;
  /** Per-exam-board availability and presentation metadata. */
  boards?: Partial<Record<ExamBoardId, BoardTopicMeta>>;
  /** AQA filename-derived placement override (see metadata/aqa_selector_placements.json). */
  selector_placement?: SelectorPlacement;
}

/**
 * GET /subtopic-meta response: a map of subtopic ID -> metadata.
 * Some subtopics appear twice (once per paper) with distinct keys.
 */
export type SubtopicMetaResponse = Record<string, SubtopicMeta>;

/** A subtopic entry paired with its ID, convenient for rendering lists. */
export interface SubtopicEntry extends SubtopicMeta {
  id: string;
}

/** Variant selection flags sent with a quiz-generation request. */
export interface TrancheSelection {
  include_rearrangements: boolean;
  include_conversions: boolean;
  /** Explicit tranche letters for custom practice (overrides boolean flags). */
  tranches?: VariantId[];
}

/**
 * Practice mode for POST /generate-quiz.
 * Preset modes ignore count/tranche_selection and always return 8 questions.
 */
export type QuizMode =
  | "custom"
  | "beginner"
  | "standard_progression"
  | "randomised";

/** Body for POST /generate-quiz. */
export interface GenerateQuizRequest {
  topics: string[];
  tranche_selection: TrancheSelection;
  include_answer: boolean;
  include_formula: boolean;
  count?: number;
  quiz_mode?: QuizMode;
  display_context?: DisplayContext;
}

/** The letter keys used for multiple-choice options. */
export type OptionLetter = "A" | "B" | "C" | "D";

/**
 * Multiple-choice options keyed by letter, e.g. `{ A: "1.2 Pa", B: "3.4 Pa" }`.
 * Partial because a question may (in future) expose fewer than four options.
 */
export type QuizOptions = Partial<Record<OptionLetter, string>>;

/**
 * A single generated question, mirroring the POST /generate-quiz contract.
 *
 * The backend is stateless: everything needed to display *and mark* a question
 * travels in this payload. Answer-key fields are present only when the request
 * set `include_answer`; equation fields only when `include_formula`.
 */
export interface Question {
  question_id: string;
  subtopic: string;
  topic_key: string;
  display_name: string;
  tranche: string;
  question_text: string;
  /** Pre-shuffled A–D options with units already formatted in. */
  options: QuizOptions;
  answer_unit: string;
  uses_rearrangement: boolean;
  uses_conversion: boolean;
  /** Answer key (only when the quiz was generated with include_answer). */
  correct_letter?: OptionLetter;
  correct_value_raw?: number;
  /** Equation info (only when the quiz was generated with include_formula). */
  equation_latex?: string;
  correct_formula?: string;
}

/** Response for POST /generate-quiz. */
export interface GenerateQuizResponse {
  requested_count: number;
  count: number;
  topics: string[];
  skipped_topics: string[];
  quiz_mode?: QuizMode;
  tranche_selection: TrancheSelection;
  allowed_tranches: string[];
  include_answer: boolean;
  include_formula: boolean;
  questions: Question[];
}

/** Body for POST /report-question. */
export interface ReportQuestionRequest {
  question_id: string;
  note: string;
}

/** Response for POST /report-question. */
export interface ReportQuestionResponse {
  status: string;
}
