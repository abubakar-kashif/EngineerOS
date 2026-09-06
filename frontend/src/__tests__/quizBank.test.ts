import { describe, expect, it } from "vitest";
import { QUIZ_ATTEMPT_SIZE, QUIZ_BANK } from "../data/quiz/quizBank";
import {
  countSeedByDifficulty,
  enrichSeedQuestions,
  sampleUnique,
  TARGET_PER_DIFFICULTY,
} from "../data/quiz/quizDifficulty";
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

describe("quiz bank shape", () => {
  const experiments = Object.entries(QUIZ_BANK);

  it("gives every experiment a 40-question base bank", () => {
    expect(experiments).toHaveLength(10);
    for (const [experimentId, questions] of experiments) {
      expect(questions, experimentId).toHaveLength(40);
    }
    expect(
      experiments.reduce((total, [, questions]) => total + questions.length, 0),
    ).toBe(400);
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

  it("enriches each experiment to 40 questions per difficulty", () => {
    for (const [experimentId, questions] of experiments) {
      const enriched = enrichSeedQuestions(experimentId, questions);
      expect(enriched).toHaveLength(3 * TARGET_PER_DIFFICULTY);
      const counts = countSeedByDifficulty(enriched);
      expect(counts.easy).toBe(TARGET_PER_DIFFICULTY);
      expect(counts.medium).toBe(TARGET_PER_DIFFICULTY);
      expect(counts.hard).toBe(TARGET_PER_DIFFICULTY);
    }
  });

  it("samples unique questions without duplicates", () => {
    const enriched = enrichSeedQuestions("ohms-law", QUIZ_BANK["ohms-law"]);
    const pool = enriched.filter((q) => q.difficulty === "hard");
    const sample = sampleUnique(pool, 20);
    expect(sample).toHaveLength(20);
    expect(new Set(sample.map((q) => q.question)).size).toBe(20);
    expect(() => sampleUnique(pool, 999)).toThrow();
  });

  it("defines a default attempt size hint", () => {
    expect(QUIZ_ATTEMPT_SIZE).toBe(20);
  });
});
