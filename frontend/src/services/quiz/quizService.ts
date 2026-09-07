import { apiRequest } from "../api";
import {
  countSeedQuestionsByDifficulty,
  QUIZ_ATTEMPT_SIZE,
  QUIZ_BANK,
  seedQuestionDifficulty,
  supportedQuestionCounts,
} from "../../data/quiz/quizBank";
import { getExperimentById } from "../experimentService";
import type { Experiment } from "../../types/experiment";
import type {
  AnswerLetter,
  Quiz,
  QuizAnswers,
  QuizAttemptDifficulty,
  QuizQuestion,
  QuizQuestionCount,
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
const SETUP_STORAGE_PREFIX = "engineeros.quiz.setup.v1_";

export type QuizSetupState = {
  difficulty: QuizAttemptDifficulty;
  questionCount: QuizQuestionCount;
};

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

/** Fisher–Yates shuffle (in place) for attempt sampling / option order. */
function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Sample up to `size` questions, always randomizing order so retries differ
 * even when the bank size equals the attempt size.
 */
function sampleAttemptQuestions<T>(questions: T[], size: number): T[] {
  const shuffled = shuffleInPlace([...questions]);
  if (shuffled.length <= size) return shuffled;
  return shuffled.slice(0, size);
}

/** Randomize A–D option order; grading remaps via option text. */
function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
  const texts = shuffleInPlace(question.options.map((option) => option.text));
  return {
    ...question,
    options: texts.map((text, index) => ({
      key: OPTION_LETTERS[index],
      text,
    })),
  };
}

export type QuizLoadOptions = {
  difficulty?: QuizAttemptDifficulty;
  questionCount?: number;
};

function difficultyForQuestion(experimentId: string, questionText: string): QuizAttemptDifficulty {
  const entry = (QUIZ_BANK[experimentId] ?? []).find(
    (item) => item.question.trim().toLowerCase() === questionText.trim().toLowerCase(),
  );
  return entry ? seedQuestionDifficulty(entry) : "easy";
}

function filterByDifficulty(
  experimentId: string,
  questions: QuizQuestion[],
  difficulty: QuizAttemptDifficulty | undefined,
): { preferred: QuizQuestion[]; rest: QuizQuestion[] } {
  if (!difficulty) return { preferred: questions, rest: [] };
  const preferred: QuizQuestion[] = [];
  const rest: QuizQuestion[] = [];
  for (const question of questions) {
    if (difficultyForQuestion(experimentId, question.question) === difficulty) {
      preferred.push(question);
    } else {
      rest.push(question);
    }
  }
  return { preferred, rest };
}

function resolveAttemptSize(requested: number | undefined, poolSize: number): number {
  if (poolSize <= 0) return 0;
  const size = requested ?? QUIZ_ATTEMPT_SIZE;
  if (size <= poolSize && size > 0) return size;
  const supported = supportedQuestionCounts(poolSize);
  return supported.length > 0 ? supported[supported.length - 1]! : poolSize;
}

function buildQuiz(
  experimentId: string,
  questions: QuizQuestion[],
  source: QuizSource,
  options?: QuizLoadOptions,
): Quiz {
  const { preferred, rest } = filterByDifficulty(experimentId, questions, options?.difficulty);
  const attemptSize = resolveAttemptSize(options?.questionCount, questions.length);
  const ordered = [
    ...sampleAttemptQuestions(preferred, preferred.length),
    ...sampleAttemptQuestions(rest, rest.length),
  ];
  const attempt = ordered.slice(0, attemptSize).map(shuffleQuestionOptions);
  return {
    experiment_id: experimentId,
    title: QUIZ_TITLE,
    description: QUIZ_DESCRIPTION,
    estimated_minutes: estimateMinutes(attempt.length),
    questions: attempt,
    attempt_size: attempt.length,
    bank_size: questions.length,
    source,
    difficulty: options?.difficulty,
  };
}

function buildSeedQuiz(experimentId: string, options?: QuizLoadOptions): Quiz | null {
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
    options,
  );
}

/**
 * Loads a quiz attempt for an experiment from the backend API when available
 * and from the seeded mirror otherwise. Optional difficulty / length sample
 * the bank; they never invent or duplicate questions.
 */
export async function getQuiz(experimentId: string, options?: QuizLoadOptions): Promise<Quiz> {
  try {
    const response = await apiRequest<ApiQuizResponse>(
      `/quizzes/${encodeURIComponent(experimentId)}`,
    );
    if (response.questions && response.questions.length > 0) {
      return buildQuiz(
        experimentId,
        response.questions.map(normalizeQuestion),
        "api",
        options,
      );
    }
  } catch {
    // Backend unavailable — fall through to the seeded bank.
  }

  const seeded = buildSeedQuiz(experimentId, options);
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

export function getSeedDifficultyCounts(experimentId: string) {
  return countSeedQuestionsByDifficulty(experimentId);
}

export function getSupportedQuestionCounts(experimentId: string): QuizQuestionCount[] {
  return supportedQuestionCounts(getSeedQuestionCount(experimentId));
}

export function hasSeedQuiz(experimentId: string): boolean {
  return getSeedQuestionCount(experimentId) > 0;
}

function answerKeyFor(experimentId: string): Map<string, { correct: AnswerLetter; explanation: string; options: string[] }> {
  const map = new Map<string, { correct: AnswerLetter; explanation: string; options: string[] }>();
  for (const entry of QUIZ_BANK[experimentId] ?? []) {
    map.set(entry.question.trim().toLowerCase(), {
      correct: entry.correct_answer,
      explanation: entry.explanation,
      options: [...entry.options],
    });
  }
  return map;
}

function letterIndex(letter: AnswerLetter): number {
  return OPTION_LETTERS.indexOf(letter);
}

/** Map a displayed answer letter back to the bank's canonical A–D letter. */
function toBankAnswer(
  question: QuizQuestion,
  displayAnswer: AnswerLetter | null,
  bankOptions: string[] | undefined,
): AnswerLetter | null {
  if (displayAnswer === null || !bankOptions) return displayAnswer;
  const selectedText = question.options.find((option) => option.key === displayAnswer)?.text;
  if (selectedText === undefined) return displayAnswer;
  const index = bankOptions.indexOf(selectedText);
  if (index < 0) return displayAnswer;
  return OPTION_LETTERS[index];
}

/** Display letter for the bank's correct option after option shuffling. */
function toDisplayCorrect(
  question: QuizQuestion,
  bankCorrect: AnswerLetter,
  bankOptions: string[],
): AnswerLetter {
  const correctText = bankOptions[letterIndex(bankCorrect)];
  const match = question.options.find((option) => option.text === correctText);
  return match?.key ?? bankCorrect;
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
    const bankAnswer = toBankAnswer(question, yourAnswer, entry?.options);
    const isCorrect =
      bankAnswer !== null && entry !== null && bankAnswer === entry.correct;
    const displayCorrect = entry
      ? toDisplayCorrect(question, entry.correct, entry.options)
      : null;
    return {
      question_id: question.id,
      question_number: index + 1,
      question: question.question,
      options: question.options,
      your_answer: yourAnswer,
      correct_answer: displayCorrect,
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
            answers: quiz.questions.map((question) => {
              const display = answers[question.id];
              const entry = key.get(question.question.trim().toLowerCase());
              return {
                question_id: question.id,
                answer: toBankAnswer(question, display ?? null, entry?.options) ?? display,
              };
            }),
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

export function saveQuizSetup(experimentId: string, setup: QuizSetupState): void {
  try {
    sessionStorage.setItem(`${SETUP_STORAGE_PREFIX}${experimentId}`, JSON.stringify(setup));
  } catch {
    // Ignore storage failures.
  }
}

export function loadQuizSetup(experimentId: string): QuizSetupState | null {
  try {
    const raw = sessionStorage.getItem(`${SETUP_STORAGE_PREFIX}${experimentId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizSetupState;
    if (parsed.difficulty !== "easy" && parsed.difficulty !== "medium" && parsed.difficulty !== "hard") {
      return null;
    }
    if (parsed.questionCount !== 10 && parsed.questionCount !== 20 && parsed.questionCount !== 40) {
      return null;
    }
    return parsed;
  } catch {
    return null;
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
