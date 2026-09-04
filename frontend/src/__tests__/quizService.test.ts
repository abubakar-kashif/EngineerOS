import { describe, expect, it } from "vitest";
import {
  clearQuizResult,
  getQuiz,
  loadQuizResult,
  NO_QUIZ_ERROR,
  saveQuizResult,
  submitQuiz,
} from "../services/quiz/quizService";
import { QUIZ_ATTEMPT_SIZE, QUIZ_BANK } from "../data/quiz/quizBank";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";
import type { AnswerLetter, Quiz, QuizAnswers } from "../types/quiz";

const OPTION_LETTERS: AnswerLetter[] = ["A", "B", "C", "D"];

/**
 * Stable 5-question fixture so tests don't break when the bank grows.
 * Uses the first N entries from the real ohms-law bank.
 */
const TEST_SIZE = 5;

function seedQuiz(): Quiz {
  const bank = QUIZ_BANK["ohms-law"].slice(0, TEST_SIZE);
  return {
    experiment_id: "ohms-law",
    title: "Knowledge Check",
    description: "Test your understanding before continuing.",
    estimated_minutes: 5,
    questions: bank.map((entry, index) => ({
      id: index + 1,
      experiment_id: "ohms-law",
      question: entry.question,
      options: entry.options.map((text, i) => ({
        key: OPTION_LETTERS[i],
        text,
      })),
    })),
    source: "seed",
  };
}

/** Same questions, but flagged as loaded from the backend (API grading path). */
function apiQuiz(): Quiz {
  return { ...seedQuiz(), source: "api" };
}

function correctAnswers(): QuizAnswers {
  const answers: QuizAnswers = {};
  QUIZ_BANK["ohms-law"].slice(0, TEST_SIZE).forEach((entry, index) => {
    answers[index + 1] = entry.correct_answer;
  });
  return answers;
}

describe("getQuiz", () => {
  it("prefers the backend quiz and normalizes the question options", async () => {
    mockApiRoutes({
      "GET /quizzes/ohms-law": jsonResponse({
        experiment_id: "ohms-law",
        questions: [
          {
            id: 1,
            experiment_id: "ohms-law",
            question: "Ohm's law is:",
            option_a: "V = IR",
            option_b: "V = I/R",
            option_c: "V = R/I",
            option_d: "V = I + R",
          },
          {
            id: 2,
            experiment_id: "ohms-law",
            question: "Unit of resistance:",
            option_a: "Volt",
            option_b: "Ampere",
            option_c: "Ohm",
            option_d: "Watt",
          },
        ],
      }),
    });

    const quiz = await getQuiz("ohms-law");

    expect(quiz.source).toBe("api");
    expect(quiz.questions).toHaveLength(2);
    expect(quiz.attempt_size).toBe(2);
    expect(quiz.bank_size).toBe(2);
    expect(quiz.questions[0].options.map((option) => option.key)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(new Set(quiz.questions[0].options.map((option) => option.text))).toEqual(
      new Set(["V = IR", "V = I/R", "V = R/I", "V = I + R"]),
    );
    expect(quiz.estimated_minutes).toBe(1);
  });

  it("falls back to the mirrored seed bank when the API is unreachable", async () => {
    // No routes installed: every fetch fails like a network outage.
    mockApiRoutes({});

    const quiz = await getQuiz("ohms-law");

    expect(quiz.source).toBe("seed");
    // The bank is sampled down to a random 40-question attempt.
    expect(quiz.bank_size).toBe(QUIZ_BANK["ohms-law"].length);
    expect(quiz.attempt_size).toBe(QUIZ_ATTEMPT_SIZE);
    expect(quiz.questions).toHaveLength(QUIZ_ATTEMPT_SIZE);
    const bankQuestions = new Set(
      QUIZ_BANK["ohms-law"].map((entry) => entry.question),
    );
    expect(
      quiz.questions.every((question) => bankQuestions.has(question.question)),
    ).toBe(true);
    expect(new Set(quiz.questions.map((question) => question.id)).size).toBe(
      QUIZ_ATTEMPT_SIZE,
    );
  });

  it("randomizes attempt order across retries", async () => {
    mockApiRoutes({});

    const orders = new Set<string>();
    for (let i = 0; i < 12; i += 1) {
      const quiz = await getQuiz("ohms-law");
      orders.add(quiz.questions.map((question) => question.id).join(","));
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  it("throws NO_QUIZ_ERROR when neither the API nor the seed bank has a quiz", async () => {
    mockApiRoutes({});

    await expect(getQuiz("does-not-exist")).rejects.toThrow(NO_QUIZ_ERROR);
  });
});

describe("submitQuiz", () => {
  it("grades seed quizzes locally with the mirrored answer key", async () => {
    const calls = mockApiRoutes({});

    const result = await submitQuiz("ohms-law", seedQuiz(), correctAnswers());

    expect(result).toMatchObject({
      score: 100,
      total_questions: TEST_SIZE,
      correct_answers: TEST_SIZE,
      unanswered: 0,
      passed: true,
      status: "excellent",
      graded_by: "local",
    });
    expect(result.feedback.every((item) => item.is_correct)).toBe(true);
    expect(result.feedback[0].explanation).toBe(QUIZ_BANK["ohms-law"][0].explanation);
    // A seed quiz never touches the backend.
    expect(calls).toHaveLength(0);
  });

  it("maps shuffled option letters back to the bank answer key", async () => {
    mockApiRoutes({});
    const quiz = seedQuiz();
    const first = quiz.questions[0];
    const bank = QUIZ_BANK["ohms-law"][0];
    // Rotate options so the bank's correct text is no longer under letter A.
    first.options = [
      { key: "A", text: bank.options[1] },
      { key: "B", text: bank.options[2] },
      { key: "C", text: bank.options[3] },
      { key: "D", text: bank.options[0] },
    ];
    const answers: QuizAnswers = { ...correctAnswers(), 1: "D" };

    const result = await submitQuiz("ohms-law", quiz, answers);

    expect(result.feedback[0].is_correct).toBe(true);
    expect(result.feedback[0].correct_answer).toBe("D");
    expect(result.correct_answers).toBe(TEST_SIZE);
  });

  it("counts wrong and unanswered questions for failed attempts", async () => {
    mockApiRoutes({});

    const wrong: QuizAnswers = {};
    for (let i = 1; i <= TEST_SIZE; i++) wrong[i] = "D";
    const allWrong = await submitQuiz("ohms-law", seedQuiz(), wrong);
    expect(allWrong).toMatchObject({
      score: 0,
      correct_answers: 0,
      unanswered: 0,
      passed: false,
      status: "incomplete",
    });

    const partial = await submitQuiz("ohms-law", seedQuiz(), { 1: "A" });
    expect(partial).toMatchObject({
      correct_answers: 1,
      unanswered: TEST_SIZE - 1,
      status: "incomplete",
    });
  });

  it("submits API quizzes to the backend, whose grading is authoritative", async () => {
    const calls = mockApiRoutes({
      "POST /quizzes/ohms-law/submit": jsonResponse({
        score: 50,
        total_questions: TEST_SIZE,
        correct_answers: Math.ceil(TEST_SIZE / 2),
        passed: false,
      }),
    });

    // Locally every answer is correct (score 100) — the backend result wins.
    const result = await submitQuiz("ohms-law", apiQuiz(), correctAnswers());

    expect(result).toMatchObject({
      score: 50,
      correct_answers: Math.ceil(TEST_SIZE / 2),
      incorrect_answers: Math.floor(TEST_SIZE / 2),
      passed: false,
      graded_by: "api",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({
      answers: Object.entries(correctAnswers()).map(([questionId, answer]) => ({
        question_id: Number(questionId),
        answer,
      })),
    });
  });

  it("does not call the grading endpoint while questions are unanswered", async () => {
    const calls = mockApiRoutes({
      "POST /quizzes/ohms-law/submit": jsonResponse({
        score: 100,
        total_questions: TEST_SIZE,
        correct_answers: TEST_SIZE,
        passed: true,
      }),
    });

    const result = await submitQuiz("ohms-law", apiQuiz(), { 1: "A" });

    expect(calls).toHaveLength(0);
    expect(result.graded_by).toBe("local");
    expect(result.unanswered).toBe(TEST_SIZE - 1);
  });

  it("keeps the locally graded result when the grading endpoint is unavailable", async () => {
    mockApiRoutes({
      "POST /quizzes/ohms-law/submit": jsonResponse({ detail: "Boom" }, 500),
    });

    const result = await submitQuiz("ohms-law", apiQuiz(), correctAnswers());

    expect(result).toMatchObject({ score: 100, passed: true, graded_by: "local" });
  });
});

describe("quiz result storage", () => {
  it("persists the latest result for the result page across refreshes", () => {
    const result = {
      ...seedQuiz(),
      score: 80,
      total_questions: 10,
      correct_answers: 8,
      incorrect_answers: 2,
      unanswered: 0,
      passed: true,
      status: "passed" as const,
      submitted_at: "2026-08-28T10:00:00.000Z",
      graded_by: "api" as const,
      feedback: [],
    };

    expect(loadQuizResult("ohms-law")).toBeNull();

    saveQuizResult("ohms-law", result);
    expect(loadQuizResult("ohms-law")).toMatchObject({ score: 80, graded_by: "api" });

    clearQuizResult("ohms-law");
    expect(loadQuizResult("ohms-law")).toBeNull();
  });
});
