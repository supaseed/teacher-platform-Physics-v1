import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { questionInstanceKey } from "./questionIdentity.ts";

describe("questionInstanceKey", () => {
  it("keeps repeated template ids independent by slot", () => {
    const templateId = "PHY-GCSE-ENERGY-KINA-01";
    const q1Key = questionInstanceKey(templateId, 0);
    const q2Key = questionInstanceKey(templateId, 1);

    assert.notEqual(q1Key, q2Key);

    const answers: Record<string, { correctValue: number }> = {};
    answers[q1Key] = { correctValue: 16.7 };

    assert.deepEqual(answers[q1Key], { correctValue: 16.7 });
    assert.equal(answers[q2Key], undefined);
  });

  it("does not mark the quiz complete after answering one of two same-template questions", () => {
    const questions = [
      { question_id: "PHY-GCSE-ENERGY-KINA-01" },
      { question_id: "PHY-GCSE-ENERGY-KINA-01" },
    ];
    const answers: Record<string, { correct: boolean }> = {
      [questionInstanceKey(questions[0].question_id, 0)]: { correct: true },
    };

    const complete = questions.every(
      (q, i) => answers[questionInstanceKey(q.question_id, i)] !== undefined,
    );

    assert.equal(complete, false);
  });
});
