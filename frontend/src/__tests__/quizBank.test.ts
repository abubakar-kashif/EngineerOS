import { describe, expect, it } from "vitest";
import { QUIZ_ATTEMPT_SIZE, QUIZ_BANK } from "../data/quiz/quizBank";
import type { AnswerLetter, QuizCategory } from "../types/quiz";

const ANSWER_LETTERS: AnswerLetter[] = ["A", "B", "C", "D"];

const CATEGORIES: QuizCategory[] = [
  "conceptual",
  "formulas",
  "numerical",
  "circuit_behaviour",
  "practical",
  "troubleshooting",
  "application",
  "common_mistakes",
];

describe("quiz bank shape (Phase 2)", () => {
  const experiments = Object.entries(QUIZ_BANK);
  const totalQuestions = experiments.reduce(
    (total, [, questions]) => total + questions.length,
    0,
  );

  it("gives every experiment at least 40 questions (prefer 50–60)", () => {
    expect(experiments).toHaveLength(10);
    for (const [experimentId, questions] of experiments) {
      expect(questions.length, experimentId).toBeGreaterThanOrEqual(40);
      expect(questions.length, experimentId).toBeGreaterThanOrEqual(50);
      expect(questions.length, experimentId).toBeLessThanOrEqual(60);
    }
  });

  it("stores only well-formed questions", () => {
    for (const [experimentId, questions] of experiments) {
      const seen = new Set<string>();
      for (const entry of questions) {
        const label = `${experimentId}: ${entry.question}`;
        expect(entry.question.trim(), label).not.toBe("");
        expect(entry.options, label).toHaveLength(4);
        expect(new Set(entry.options).size, label).toBe(4);
        expect(ANSWER_LETTERS, label).toContain(entry.correct_answer);
        expect(entry.explanation.trim(), label).not.toBe("");
        if (entry.category) {
          expect(CATEGORIES, label).toContain(entry.category);
        }
        expect(seen.has(entry.question), `${label} duplicated`).toBe(false);
        seen.add(entry.question);
      }
    }
  });

  it("keeps question texts unique across the whole bank", () => {
    const all = experiments.flatMap(([, questions]) =>
      questions.map((entry) => entry.question),
    );
    expect(new Set(all).size).toBe(totalQuestions);
  });

  it("defines a 40-question attempt smaller than each bank", () => {
    expect(QUIZ_ATTEMPT_SIZE).toBe(40);
    for (const [, questions] of experiments) {
      expect(QUIZ_ATTEMPT_SIZE).toBeLessThan(questions.length);
    }
  });
});
