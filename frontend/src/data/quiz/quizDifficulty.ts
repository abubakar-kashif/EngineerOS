/**
 * Mirrors backend/app/data/quiz_difficulty.py — difficulty tags + pool expansion.
 */
import type { AnswerLetter } from "../../types/quiz";
import type { SeedQuizQuestion } from "./quizBank";

export const QUIZ_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type QuizDifficultyLevel = (typeof QUIZ_DIFFICULTIES)[number];
export const QUIZ_ALLOWED_COUNTS = [10, 20, 40] as const;
export type QuizQuestionCount = (typeof QUIZ_ALLOWED_COUNTS)[number];
export const TARGET_PER_DIFFICULTY = 40;

export interface EnrichedSeedQuestion extends SeedQuizQuestion {
  difficulty: QuizDifficultyLevel;
}

function ohmExtra(difficulty: QuizDifficultyLevel, index: number): EnrichedSeedQuestion {
  if (difficulty === "easy") {
    const v = 5 + index;
    const r = 5 + (index % 7);
    const i = Math.round((v / r) * 10000) / 10000;
    return {
      question: `Easy check ${index + 1}: ${v} V across ${r} Ω. Current is:`,
      options: [`${i} A`, `${v * r} A`, `${r / v} A`, `${v + r} A`],
      correct_answer: "A",
      explanation: `I = V/R = ${v}/${r} = ${i} A.`,
      difficulty: "easy",
    };
  }
  if (difficulty === "medium") {
    const v = 12 + index;
    const r = 3 + (index % 5);
    const p = Math.round(((v * v) / r) * 10000) / 10000;
    return {
      question: `Medium check ${index + 1}: ${v} V across ${r} Ω. Power is:`,
      options: [`${p} W`, `${v / r} W`, `${v * r} W`, `${r / v} W`],
      correct_answer: "A",
      explanation: `P = V²/R = ${v}²/${r} = ${p} W.`,
      difficulty: "medium",
    };
  }
  const v = 24 + index;
  const r1 = 4 + (index % 4);
  const r2 = 8 + (index % 3);
  const i = Math.round((v / (r1 + r2)) * 10000) / 10000;
  return {
    question: `Hard check ${index + 1}: ${v} V drives ${r1} Ω and ${r2} Ω in series. Loop current is:`,
    options: [`${i} A`, `${v / r1} A`, `${v / r2} A`, `${v * (r1 + r2)} A`],
    correct_answer: "A" as AnswerLetter,
    explanation: `I = V/(R1+R2) = ${v}/(${r1}+${r2}) = ${i} A.`,
    difficulty: "hard",
  };
}

function genericExtra(
  experimentId: string,
  difficulty: QuizDifficultyLevel,
  index: number,
): EnrichedSeedQuestion {
  const topic = experimentId.replace(/-/g, " ");
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const n = index + 1;
  if (difficulty === "easy") {
    return {
      question: `${label} ${topic} fact #${n}: which statement is true?`,
      options: [
        `Core ${topic} relationships must be applied carefully`,
        `${topic} never uses Ohm's law`,
        `${topic} ignores voltage entirely`,
        `${topic} only uses mechanical gears`,
      ],
      correct_answer: "A",
      explanation: `Basic ${topic} questions reinforce core ideas.`,
      difficulty: "easy",
    };
  }
  if (difficulty === "medium") {
    return {
      question: `${label} ${topic} analysis #${n}: the next step is to:`,
      options: [
        `Apply the governing ${topic} equations to the circuit`,
        "Ignore measured values",
        "Remove the ground always",
        "Double every resistor randomly",
      ],
      correct_answer: "A",
      explanation: `Medium ${topic} items require applying equations.`,
      difficulty: "medium",
    };
  }
  return {
    question: `${label} ${topic} troubleshooting #${n}: a surprising reading means:`,
    options: [
      `Recheck assumptions and recompute with ${topic} laws`,
      "Delete the experiment",
      "Assume the meter is always wrong",
      "Ignore polarity and ground",
    ],
    correct_answer: "A",
    explanation: `Hard ${topic} items emphasize diagnosis and verification.`,
    difficulty: "hard",
  };
}

function makeExtra(
  experimentId: string,
  difficulty: QuizDifficultyLevel,
  index: number,
): EnrichedSeedQuestion {
  if (experimentId === "ohms-law") return ohmExtra(difficulty, index);
  return genericExtra(experimentId, difficulty, index);
}

export function enrichSeedQuestions(
  experimentId: string,
  questions: SeedQuizQuestion[],
): EnrichedSeedQuestion[] {
  const tagged: EnrichedSeedQuestion[] = questions.map((q, i) => ({
    ...q,
    difficulty: (q as EnrichedSeedQuestion).difficulty ?? QUIZ_DIFFICULTIES[i % 3],
  }));

  const byDiff: Record<QuizDifficultyLevel, EnrichedSeedQuestion[]> = {
    easy: [],
    medium: [],
    hard: [],
  };
  for (const q of tagged) byDiff[q.difficulty].push(q);

  for (const difficulty of QUIZ_DIFFICULTIES) {
    const need = TARGET_PER_DIFFICULTY - byDiff[difficulty].length;
    for (let i = 0; i < Math.max(0, need); i++) {
      byDiff[difficulty].push(makeExtra(experimentId, difficulty, i));
    }
  }

  return QUIZ_DIFFICULTIES.flatMap((d) => byDiff[d].slice(0, TARGET_PER_DIFFICULTY));
}

export function countSeedByDifficulty(
  questions: EnrichedSeedQuestion[],
): Record<QuizDifficultyLevel, number> {
  const counts: Record<QuizDifficultyLevel, number> = { easy: 0, medium: 0, hard: 0 };
  for (const q of questions) counts[q.difficulty] += 1;
  return counts;
}

/** Unique random sample (no duplicates). */
export function sampleUnique<T>(items: T[], count: number): T[] {
  if (count > items.length) {
    throw new Error(`Requested ${count} but only ${items.length} available`);
  }
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
