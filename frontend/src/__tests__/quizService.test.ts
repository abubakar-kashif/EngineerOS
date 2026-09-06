import { describe, expect, it } from "vitest";
import {
  clearQuizResult,
  getQuiz,
  loadQuizResult,
  NO_QUIZ_ERROR,
  saveQuizResult,
  startQuiz,
  submitQuiz,
} from "../services/quiz/quizService";
import { QUIZ_ATTEMPT_SIZE, QUIZ_BANK } from "../data/quiz/quizBank";
import { TARGET_PER_DIFFICULTY } from "../data/quiz/quizDifficulty";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";
import type { AnswerLetter, Quiz, QuizAnswers } from "../types/quiz";

const OPTION_LETTERS: AnswerLetter[] = ["A", "B", "C", "D"];

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
    attempt_size: TEST_SIZE,
    difficulty: "easy",
  };
}

function apiQuiz(): Quiz {
  return { ...seedQuiz(), source: "api", difficulty: "easy", attempt_size: TEST_SIZE };
}

function correctAnswers(): QuizAnswers {
  const answers: QuizAnswers = {};
  QUIZ_BANK["ohms-law"].slice(0, TEST_SIZE).forEach((entry, index) => {
    answers[index + 1] = entry.correct_answer;
  });
  return answers;
}

describe("startQuiz / getQuiz", () => {
  it("starts from the backend with filtered difficulty questions", async () => {
    mockApiRoutes({
      "POST /quizzes/ohms-law/start": jsonResponse({
        experiment_id: "ohms-law",
        difficulty: "easy",
        question_count: 10,
        available: 40,
        questions: [
          {
            id: 1,
            experiment_id: "ohms-law",
            question: "Ohm's law is:",
            option_a: "V = IR",
            option_b: "V = I/R",
            option_c: "V = R/I",
            option_d: "V = I + R",
            difficulty: "easy",
          },
          {
            id: 2,
            experiment_id: "ohms-law",
            question: "Unit of resistance:",
            option_a: "Volt",
            option_b: "Ampere",
            option_c: "Ohm",
            option_d: "Watt",
            difficulty: "easy",
          },
        ],
      }),
    });

    const quiz = await startQuiz("ohms-law", 10, "easy");

    expect(quiz.source).toBe("api");
    expect(quiz.questions).toHaveLength(2);
    expect(quiz.difficulty).toBe("easy");
    expect(quiz.questions[0].options[0]).toEqual({ key: "A", text: "V = IR" });
  });

  it("falls back to the enriched seed bank when the API is unreachable", async () => {
    mockApiRoutes({});

    const quiz = await getQuiz("ohms-law");

    expect(quiz.source).toBe("seed");
    expect(quiz.difficulty).toBe("medium");
    expect(quiz.attempt_size).toBe(QUIZ_ATTEMPT_SIZE);
    expect(quiz.questions).toHaveLength(QUIZ_ATTEMPT_SIZE);
    expect(quiz.available).toBe(TARGET_PER_DIFFICULTY);
    expect(new Set(quiz.questions.map((question) => question.id)).size).toBe(
      QUIZ_ATTEMPT_SIZE,
    );
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
    expect(calls).toHaveLength(0);
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
      difficulty: "easy",
      question_count: TEST_SIZE,
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
