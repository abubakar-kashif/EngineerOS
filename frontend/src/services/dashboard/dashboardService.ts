/**
 * Dashboard aggregation service.
 *
 * Assembles everything the dashboard renders. Signed-in users get
 * backend-authoritative numbers (progress summary, persisted quiz attempts,
 * saved reports); anonymous visitors see this device's locally tracked
 * progress and quiz results instead.
 */
import { getExperiments } from "../experimentService";
import { getMyProgress, getProgress, type Progress } from "../progressService";
import { getReports } from "../reports/reportsService";
import { getMyQuizAttempts, loadQuizResult, type QuizAttemptRecord } from "../quiz/quizService";
import { getAllProgress, getRecentExperiments, type UserProgress } from "../../utils/experimentProgress";
import { getLearningPreferences } from "../settings/settingsService";
import { getAuthToken } from "../api";
import { DEFAULT_LEARNING_PREFERENCES } from "../../types/settings";
import type { Experiment, ExperimentDifficulty } from "../../types/experiment";
import type { Report } from "../../types/reports";
import type { QuizStatus } from "../../types/quiz";
import type {
  ActivityType,
  DashboardActivityItem,
  DashboardData,
  DashboardProgressTrack,
  DashboardRecommendation,
  QuizAttemptSummary,
} from "../../types/dashboard";

const MAX_ACTIVITY_ITEMS = 6;
const MAX_RECOMMENDATIONS = 3;
/** Matches the backend passing threshold (PASSING_SCORE in quiz_service.py). */
const PASSING_SCORE = 70;

const DIFFICULTY_RANK: Record<ExperimentDifficulty, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

/** Loads the experiment catalog from the backend. */
async function loadExperiments(): Promise<Experiment[]> {
  const response = await getExperiments();
  return response.items;
}

/**
 * Progress for the dashboard: the account's server-side rows when signed
 * in, this device's local tracking for anonymous visitors. Local tracking
 * never leaks into a signed-in view — a new account starts clean.
 */
async function loadProgress(): Promise<{
  map: Record<string, UserProgress>;
  rows: Progress[];
}> {
  if (!getAuthToken()) {
    return { map: getAllProgress(), rows: [] };
  }

  const rows = await getMyProgress();
  const map: Record<string, UserProgress> = {};
  for (const row of rows) {
    map[row.experiment_id] = row.status === "completed" ? "completed" : "in_progress";
  }
  return { map, rows };
}

/** Account learning preferences; defaults when they can't be loaded. */
async function loadLearningPreferences() {
  try {
    return await getLearningPreferences();
  } catch {
    return DEFAULT_LEARNING_PREFERENCES;
  }
}

/** Reads every locally stored quiz attempt for the given experiments. */
function collectQuizAttempts(experiments: Experiment[]): QuizAttemptSummary[] {
  const attempts: QuizAttemptSummary[] = [];
  for (const experiment of experiments) {
    const result = loadQuizResult(experiment.id);
    if (!result) continue;
    attempts.push({
      experiment_id: experiment.id,
      experiment_title: experiment.title,
      score: result.score,
      correct_answers: result.correct_answers,
      total_questions: result.total_questions,
      status: result.status,
      submitted_at: result.submitted_at,
    });
  }
  // Newest first.
  attempts.sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  return attempts;
}

/** Maps the quiz status buckets onto a persisted attempt's score. */
function quizStatusFromScore(score: number): QuizStatus {
  if (score >= 90) return "excellent";
  if (score >= PASSING_SCORE) return "passed";
  if (score >= 40) return "needs_review";
  return "incomplete";
}

/** Maps the signed-in user's persisted attempts onto the summary shape. */
function attemptsFromServer(
  records: QuizAttemptRecord[],
  experiments: Experiment[],
): QuizAttemptSummary[] {
  return records.map((record) => ({
    experiment_id: record.experiment_id,
    experiment_title:
      experiments.find((experiment) => experiment.id === record.experiment_id)?.title ??
      record.experiment_id,
    score: Math.round(record.score),
    correct_answers: record.correct_answers,
    total_questions: record.total_questions,
    status: quizStatusFromScore(record.score),
    submitted_at: record.created_at,
  }));
}

/** Progress rows become "experiment" activity entries. */
function experimentActivity(
  rows: Progress[],
  experiments: Experiment[],
): DashboardActivityItem[] {
  return rows.map((row) => ({
    id: String(row.id),
    type: "experiment" as ActivityType,
    title:
      experiments.find((experiment) => experiment.id === row.experiment_id)?.title ??
      row.experiment_id,
    description: row.status === "completed" ? "Experiment completed" : "Experiment in progress",
    timestamp: row.updated_at,
    href: `/experiments/${row.experiment_id}`,
  }));
}

function quizActivity(attempts: QuizAttemptSummary[]): DashboardActivityItem[] {
  return attempts.map((attempt) => ({
    // Include the timestamp — several attempts can exist per experiment.
    id: `quiz-${attempt.experiment_id}-${attempt.submitted_at}`,
    type: "quiz" as ActivityType,
    title: `${attempt.experiment_title} quiz`,
    description: `Scored ${attempt.score}% (${attempt.correct_answers}/${attempt.total_questions} correct)`,
    timestamp: attempt.submitted_at,
    href: `/quiz/${attempt.experiment_id}/result`,
  }));
}

function reportActivity(reports: Report[]): DashboardActivityItem[] {
  // Only reports with a timestamp can be placed on the timeline.
  return reports
    .filter((report) => report.created_at)
    .map((report) => ({
      id: `report-${report.id}`,
      type: "report" as ActivityType,
      title: report.title,
      description: `Lab report — ${report.status === "completed" ? "completed" : "in progress"}`,
      timestamp: report.created_at as string,
      href: `/reports/${report.id}`,
    }));
}

/**
 * Picks the next experiments to try: not started, prerequisites satisfied,
 * ranked by closeness to the user's preferred difficulty.
 */
function buildRecommendations(
  experiments: Experiment[],
  completedIds: Set<string>,
  startedIds: Set<string>,
  preferredDifficulty: ExperimentDifficulty,
): DashboardRecommendation[] {
  const candidates = experiments.filter((experiment) => {
    if (startedIds.has(experiment.id)) return false;
    const prerequisites = experiment.prerequisites ?? [];
    return prerequisites.every((prerequisite) => completedIds.has(prerequisite));
  });

  const preferredRank = DIFFICULTY_RANK[preferredDifficulty];

  return candidates
    .map((experiment) => {
      const distance = Math.abs(DIFFICULTY_RANK[experiment.difficulty] - preferredRank);
      const prerequisite = (experiment.prerequisites ?? []).find((id) => completedIds.has(id));
      let reason: string;
      if (prerequisite) {
        const source = experiments.find((e) => e.id === prerequisite);
        reason = `Natural next step after ${source?.title ?? "your last experiment"}`;
      } else if (distance === 0) {
        reason = `Matches your preferred ${experiment.difficulty.toLowerCase()} level`;
      } else {
        reason = `${experiment.difficulty} · ${experiment.category}`;
      }
      return { experiment, reason, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ experiment, reason }) => ({ experiment, reason }));
}

function percent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

/** Assembles the full dashboard payload. */
export async function getDashboardData(): Promise<DashboardData> {
  const experiments = await loadExperiments();
  const signedIn = Boolean(getAuthToken());
  const { map: progressMap, rows: progressRows } = await loadProgress();
  const recentIds = getRecentExperiments();
  const preferences = await loadLearningPreferences();

  const completedIds = new Set(
    Object.entries(progressMap)
      .filter(([, status]) => status === "completed")
      .map(([id]) => id),
  );
  const inProgressIds = Object.entries(progressMap)
    .filter(([, status]) => status === "in_progress")
    .map(([id]) => id);
  const startedIds = new Set([...completedIds, ...inProgressIds]);

  // Signed-in KPIs come from the backend summary — the single source of
  // truth for progress recorded on any device. Anonymous visitors are
  // measured from this device's local tracking.
  const summary = signedIn ? await getProgress() : null;
  const completedExperiments = summary ? summary.completed_experiments : completedIds.size;
  const overallProgress = summary
    ? Math.round(summary.overall_progress)
    : percent(completedExperiments, experiments.length);

  const attempts = signedIn
    ? attemptsFromServer(await getMyQuizAttempts(), experiments)
    : collectQuizAttempts(experiments);
  const averageQuizScore =
    attempts.length > 0
      ? Math.round(
          summary
            ? summary.average_quiz_score
            : attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length,
        )
      : null;

  let reports: Report[] = [];
  try {
    reports = await getReports();
  } catch {
    // Reports are optional for the dashboard.
  }

  const passedQuizIds = new Set(
    attempts.filter((a) => a.score >= PASSING_SCORE).map((a) => a.experiment_id),
  );
  const completedReports = reports.filter((report) => report.status === "completed").length;

  const progress: DashboardProgressTrack[] = [
    {
      key: "experiments",
      label: "Experiments",
      completed: completedExperiments,
      total: experiments.length,
      percent: percent(completedExperiments, experiments.length),
    },
    {
      key: "quizzes",
      label: "Quizzes",
      completed: passedQuizIds.size,
      total: experiments.length,
      percent: percent(passedQuizIds.size, experiments.length),
    },
    {
      key: "reports",
      label: "Reports",
      completed: completedReports,
      total: reports.length,
      percent: percent(completedReports, reports.length),
    },
  ];

  const activity = [
    ...experimentActivity(progressRows, experiments),
    ...quizActivity(attempts),
    ...reportActivity(reports),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, MAX_ACTIVITY_ITEMS);

  // Continue where the user left off: the most recently opened in-progress experiment.
  let continueLearning: Experiment | null = null;
  for (const id of recentIds) {
    if (inProgressIds.includes(id)) {
      continueLearning = experiments.find((e) => e.id === id) ?? null;
      if (continueLearning) break;
    }
  }
  if (!continueLearning && inProgressIds.length > 0) {
    continueLearning = experiments.find((e) => e.id === inProgressIds[0]) ?? null;
  }

  const nextRecommended = buildRecommendations(
    experiments,
    completedIds,
    startedIds,
    preferences.preferred_difficulty,
  );

  return {
    kpis: {
      completed_experiments: completedExperiments,
      in_progress_experiments: inProgressIds.length,
      average_quiz_score: averageQuizScore,
      overall_progress: overallProgress,
    },
    progress,
    activity,
    continueLearning,
    nextRecommended,
    quizAttempts: attempts,
  };
}

/** Time-of-day greeting used by the dashboard header. */
export function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Compact relative time, e.g. "2h ago" or "3d ago". */
export function formatRelativeTime(iso: string): string {
  // The API returns naive UTC timestamps (no "Z"/offset). `new Date()`
  // would read those as local time — off by the UTC offset — so attach
  // "Z" whenever the string carries no timezone information.
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso) ? iso : `${iso}Z`;
  const timestamp = new Date(normalized).getTime();
  if (Number.isNaN(timestamp)) return "";
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(normalized).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
