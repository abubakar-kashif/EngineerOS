import { apiRequest } from "../api";
import { QUIZ_ATTEMPT_SIZE, QUIZ_BANK } from "../../data/quiz/quizBank";
import { getExperimentById } from "../experimentService";
import type { Experiment } from "../../types/experiment";
import type {
  AnswerLetter,
  Quiz,
  QuizAnswers,
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
}

interface ApiQuizResponse {
  experiment_id: string;
  questions: ApiQuizQuestion[];
}

interface ApiQuizSubmitResponse {
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
}

/** One graded attempt from the user's persisted quiz history. */
export interface QuizAttemptRecord {
  id: number;
  experiment_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  created_at: string;
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
  };
}

/** Phase 6: an attempt presents a random sample of the bank (all of it when small). */
function sampleAttemptQuestions<T>(questions: T[]): T[] {
  if (questions.length <= QUIZ_ATTEMPT_SIZE) return questions;
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUIZ_ATTEMPT_SIZE);
}

function buildQuiz(
  experimentId: string,
  questions: QuizQuestion[],
  source: QuizSource,
): Quiz {
  const attempt = sampleAttemptQuestions(questions);
  return {
    experiment_id: experimentId,
    title: QUIZ_TITLE,
    description: QUIZ_DESCRIPTION,
    estimated_minutes: estimateMinutes(attempt.length),
    questions: attempt,
    attempt_size: attempt.length,
    bank_size: questions.length,
    source,
  };
}

function buildSeedQuiz(experimentId: string): Quiz | null {
  const bank = QUIZ_BANK[experimentId];
  if (!bank || bank.length === 0) return null;

  return buildQuiz(
    experimentId,
    bank.map((entry, index) => ({
      id: index + 1,
      experiment_id: experimentId,
      question: entry.question,
      options: entry.options.map((text, i) => ({ key: OPTION_LETTERS[i], text })),
    })),
    "seed",
  );
}

/**
 * Loads a quiz attempt for an experiment: a random QUIZ_ATTEMPT_SIZE sample
 * of the bank, taken from the backend API when available and from the
 * seeded mirror otherwise. Throws NO_QUIZ_ERROR when no assessment exists
 * for the experiment.
 */
export async function getQuiz(experimentId: string): Promise<Quiz> {
  try {
    const response = await apiRequest<ApiQuizResponse>(
      `/quizzes/${encodeURIComponent(experimentId)}`,
    );
    if (response.questions && response.questions.length > 0) {
      return buildQuiz(
        experimentId,
        response.questions.map(normalizeQuestion),
        "api",
      );
    }
  } catch {
    // Backend unavailable — fall through to the seeded bank.
  }

  const seeded = buildSeedQuiz(experimentId);
  if (!seeded) {
    throw new Error(NO_QUIZ_ERROR);
  }
  return seeded;
}

/** Experiments that have a seeded assessment (used by the quiz index). */
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
  for (const entry of QUIZ_BANK[experimentId] ?? []) {
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

/**
 * Submits quiz answers and grades them. Per-question feedback is computed from
 * the mirrored answer key; when the quiz came from the API the backend grading
 * endpoint is authoritative for the aggregate score.
 */
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

/** Persists the latest result so the result page survives a refresh. */
export function saveQuizResult(experimentId: string, result: QuizResult): void {
  try {
    sessionStorage.setItem(
      `${RESULT_STORAGE_PREFIX}${experimentId}`,
      JSON.stringify(result),
    );
  } catch {
    // Storage unavailable (private mode) — the result page falls back to state.
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
    // Ignore storage failures.
  }
}

/** The signed-in user's graded quiz attempts, newest first (server history). */
export async function getMyQuizAttempts(): Promise<QuizAttemptRecord[]> {
  return apiRequest<QuizAttemptRecord[]>("/quizzes/me/attempts");
}

/**
 * Resolves experiment metadata (title, difficulty) for quiz headers and
 * breadcrumbs. Returns null when the catalog is unreachable — callers
 * degrade gracefully instead of showing bundled data.
 */
export async function getExperimentMeta(experimentId: string): Promise<Experiment | null> {
  try {
    return (await getExperimentById(experimentId)) ?? null;
  } catch {
    return null;
  }
}
