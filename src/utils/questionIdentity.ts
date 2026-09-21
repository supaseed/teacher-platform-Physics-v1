/**
 * Backend `question_id` is a template id (e.g. PHY-GCSE-ENERGY-KINA-01).
 * A generated set can sample the same stem more than once with different
 * numbers, so those instances share a question_id. Answer state and React
 * keys must be scoped to the slot in *this* quiz, not the template id.
 */
export function questionInstanceKey(
  questionId: string | undefined,
  index: number,
): string {
  return `${index}:${questionId || "q"}`;
}
