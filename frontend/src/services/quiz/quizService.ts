import { apiRequest, ApiError } from "../api";
import { QUIZ_ATTEMPT_SIZE, QUIZ_BANK } from "../../data/quiz/quizBank";
import {
  countSeedByDifficulty,
  enrichSeedQuestions,
  sampleUnique,
  type QuizDifficultyLevel,
  type QuizQuestionCount,
} from "../../data/quiz/quizDifficulty";
import { getExperimentById } from "../experimentService";
import type { Experiment } from "../../types/experiment";
import type {
  AnswerLetter,
  Quiz,
  QuizAnswers,
  QuizDifficulty,
  QuizQuestion,
  QuizResult,
  QuestionFeedback,
  QuizSource,
  QuizStatus,
} from "../../types/quiz";

/** Matches the backend passing threshold (PASSING_SCORE in quiz_service.py). */
const PASSING_SCORE = 70;
const SECONDS_PER_QUESTION = 30;

/** Thrown by getQuiz when neither the API nor the seed bank has a quiz. */
export const NO_QUIZ_ERROR = "NO_QUIZ_AVAILABLE";

const QUIZ_TITLE = "Knowledge Check";
const QUIZ_DESCRIPTION = "Test your understanding before continuing.";

const OPTION_LETTERS: AnswerLetter[] = ["A", "B", "C", "D"];

const RESULT_STORAGE_PREFIX = "engineeros_quiz_result_";

interface ApiQuizQuestion {
  id: number;
  experiment_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty?: QuizDifficulty;
}

interface ApiQuizResponse {
  experiment_id: string;
  questions: ApiQuizQuestion[];
  difficulty?: QuizDifficulty;
  question_count?: number;
  available?: number;
}

interface ApiAvailabilityResponse {
  experiment_id: string;
  counts: Record<string, number>;
  allowed_counts: number[];
  allowed_difficulties: string[];
}

interface ApiQuizSubmitResponse {
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
}

export interface QuizAttemptRecord {
  id: number;
  experiment_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  created_at: string;
}

export interface QuizAvailability {
  experiment_id: string;
  counts: Record<QuizDifficultyLevel, number>;
  allowed_counts: QuizQuestionCount[];
  allowed_difficulties: QuizDifficultyLevel[];
}

function estimateMinutes(questionCount: number): number {
  return Math.max(1, Math.ceil((questionCount * SECONDS_PER_QUESTION) / 60));
}

function normalizeQuestion(raw: ApiQuizQuestion): QuizQuestion {
  return {
    id: raw.id,
    experiment_id: raw.experiment_id,
    question: raw.question,
    options: [
      { key: "A", text: raw.option_a },
      { key: "B", text: raw.option_b },
      { key: "C", text: raw.option_c },
      { key: "D", text: raw.option_d },
    ],
    difficulty: raw.difficulty,
  };
}

function buildQuizFromQuestions(
  experimentId: string,
  questions: QuizQuestion[],
  source: QuizSource,
  meta?: { difficulty?: QuizDifficulty; available?: number },
): Quiz {
  return {
    experiment_id: experimentId,
    title: QUIZ_TITLE,
    description: QUIZ_DESCRIPTION,
    estimated_minutes: estimateMinutes(questions.length),
    questions,
    attempt_size: questions.length,
    bank_size: meta?.available ?? questions.length,
    source,
    difficulty: meta?.difficulty,
    available: meta?.available,
  };
}

/**
 * Loads quiz availability counts for the setup screen.
 */
export async function getQuizAvailability(experimentId: string): Promise<QuizAvailability> {
  try {
    const response = await apiRequest<ApiAvailabilityResponse>(
      `/quizzes/${encodeURIComponent(experimentId)}/availability`,
    );
    return {
      experiment_id: response.experiment_id,
      counts: {
        easy: response.counts.easy ?? 0,
        medium: response.counts.medium ?? 0,
        hard: response.counts.hard ?? 0,
      },
      allowed_counts: response.allowed_counts as QuizQuestionCount[],
      allowed_difficulties: response.allowed_difficulties as QuizDifficultyLevel[],
    };
  } catch {
    const bank = QUIZ_BANK[experimentId];
    if (!bank?.length) throw new Error(NO_QUIZ_ERROR);
    const enriched = enrichSeedQuestions(experimentId, bank);
    return {
      experiment_id: experimentId,
      counts: countSeedByDifficulty(enriched),
      allowed_counts: [10, 20, 40],
      allowed_difficulties: ["easy", "medium", "hard"],
    };
  }
}

/**
 * Starts an attempt: backend filters by difficulty and samples unique questions.
 * Falls back to the enriched seed bank when the API is unavailable.
 */
export async function startQuiz(
  experimentId: string,
  questionCount: QuizQuestionCount,
  difficulty: QuizDifficulty,
): Promise<Quiz> {
  try {
    const response = await apiRequest<ApiQuizResponse>(
      `/quizzes/${encodeURIComponent(experimentId)}/start`,
      {
        method: "POST",
        body: JSON.stringify({
          question_count: questionCount,
          difficulty,
        }),
      },
    );
    if (!response.questions?.length) {
      throw new Error("Empty quiz start response");
    }
    return buildQuizFromQuestions(
      experimentId,
      response.questions.map(normalizeQuestion),
      "api",
      {
        difficulty: response.difficulty ?? difficulty,
        available: response.available,
      },
    );
  } catch (error) {
    // Client/validation errors (insufficient pool, bad payload) must surface.
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      throw error;
    }
    // Network / server failures fall through to the seed bank.
  }

  const bank = QUIZ_BANK[experimentId];
  if (!bank?.length) throw new Error(NO_QUIZ_ERROR);

  const enriched = enrichSeedQuestions(experimentId, bank);
  const pool = enriched.filter((q) => q.difficulty === difficulty);
  if (pool.length < questionCount) {
    throw new Error(
      `${questionCount} ${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)} questions are not currently available. Available: ${pool.length}. Please choose a smaller quiz or another difficulty.`,
    );
  }

  const sampled = sampleUnique(pool, questionCount);
  return buildQuizFromQuestions(
    experimentId,
    sampled.map((entry, index) => ({
      id: index + 1,
      experiment_id: experimentId,
      question: entry.question,
      options: entry.options.map((text, i) => ({ key: OPTION_LETTERS[i], text })),
      difficulty: entry.difficulty,
    })),
    "seed",
    { difficulty, available: pool.length },
  );
}

/** @deprecated Prefer startQuiz — kept for callers that still expect a full bank load. */
export async function getQuiz(experimentId: string): Promise<Quiz> {
  return startQuiz(experimentId, QUIZ_ATTEMPT_SIZE as QuizQuestionCount, "medium");
}

export function getSeedQuizIds(): string[] {
  return Object.keys(QUIZ_BANK);
}

export function getSeedQuestionCount(experimentId: string): number {
  return QUIZ_BANK[experimentId]?.length ?? 0;
}

export function hasSeedQuiz(experimentId: string): boolean {
  return getSeedQuestionCount(experimentId) > 0;
}

function answerKeyFor(experimentId: string): Map<string, { correct: AnswerLetter; explanation: string }> {
  const map = new Map<string, { correct: AnswerLetter; explanation: string }>();
  const enriched = enrichSeedQuestions(experimentId, QUIZ_BANK[experimentId] ?? []);
  for (const entry of enriched) {
    map.set(entry.question.trim().toLowerCase(), {
      correct: entry.correct_answer,
      explanation: entry.explanation,
    });
  }
  return map;
}

function statusFor(score: number, unanswered: number, total: number): QuizStatus {
  if (total > 0 && unanswered === total) return "incomplete";
  if (score >= 90) return "excellent";
  if (score >= PASSING_SCORE) return "passed";
  if (score >= 40) return "needs_review";
  return "incomplete";
}

export async function submitQuiz(
  experimentId: string,
  quiz: Quiz,
  answers: QuizAnswers,
): Promise<QuizResult> {
  const key = answerKeyFor(experimentId);
  const total = quiz.questions.length;

  const feedback: QuestionFeedback[] = quiz.questions.map((question, index) => {
    const entry = key.get(question.question.trim().toLowerCase()) ?? null;
    const yourAnswer = answers[question.id] ?? null;
    const isCorrect = yourAnswer !== null && entry !== null && yourAnswer === entry.correct;
    return {
      question_id: question.id,
      question_number: index + 1,
      question: question.question,
      options: question.options,
      your_answer: yourAnswer,
      correct_answer: entry ? entry.correct : null,
      is_correct: isCorrect,
      explanation: entry
        ? entry.explanation
        : "Explanation is not available for this question.",
    };
  });

  const unanswered = feedback.filter((f) => f.your_answer === null).length;
  const localCorrect = feedback.filter((f) => f.is_correct).length;
  let score = total > 0 ? Math.round((localCorrect / total) * 10000) / 100 : 0;
  let correct = localCorrect;
  let passed = score >= PASSING_SCORE;
  let gradedBy: "api" | "local" = "local";

  if (quiz.source === "api" && unanswered === 0) {
    try {
      const response = await apiRequest<ApiQuizSubmitResponse>(
        `/quizzes/${encodeURIComponent(experimentId)}/submit`,
        {
          method: "POST",
          body: JSON.stringify({
            answers: quiz.questions.map((question) => ({
              question_id: question.id,
              answer: answers[question.id],
            })),
            difficulty: quiz.difficulty ?? null,
            question_count: quiz.attempt_size ?? total,
          }),
        },
      );
      score = response.score;
      correct = response.correct_answers;
      passed = response.passed;
      gradedBy = "api";
    } catch {
      // Backend unavailable — keep the locally graded result.
    }
  }

  return {
    experiment_id: experimentId,
    score,
    total_questions: total,
    correct_answers: correct,
    incorrect_answers: total - correct,
    unanswered,
    passed,
    status: statusFor(score, unanswered, total),
    submitted_at: new Date().toISOString(),
    graded_by: gradedBy,
    feedback,
  };
}

export function saveQuizResult(experimentId: string, result: QuizResult): void {
  try {
    sessionStorage.setItem(
      `${RESULT_STORAGE_PREFIX}${experimentId}`,
      JSON.stringify(result),
    );
  } catch {
    // ignore
  }
}

export function loadQuizResult(experimentId: string): QuizResult | null {
  try {
    const raw = sessionStorage.getItem(`${RESULT_STORAGE_PREFIX}${experimentId}`);
    return raw ? (JSON.parse(raw) as QuizResult) : null;
  } catch {
    return null;
  }
}

export function clearQuizResult(experimentId: string): void {
  try {
    sessionStorage.removeItem(`${RESULT_STORAGE_PREFIX}${experimentId}`);
  } catch {
    // ignore
  }
}

export async function getMyQuizAttempts(): Promise<QuizAttemptRecord[]> {
  return apiRequest<QuizAttemptRecord[]>("/quizzes/me/attempts");
}

export async function getExperimentMeta(experimentId: string): Promise<Experiment | null> {
  try {
    return (await getExperimentById(experimentId)) ?? null;
  } catch {
    return null;
  }
}
