import type { Experiment } from "./experiment";
import type { QuizStatus } from "./quiz";

/** Aggregate KPI numbers shown in the dashboard header row. */
export interface DashboardKpis {
  completed_experiments: number;
  in_progress_experiments: number;
  /** Average score (0-100) across locally recorded quiz attempts; null when none exist. */
  average_quiz_score: number | null;
  /** Overall learning progress percentage (0-100). */
  overall_progress: number;
}

/** One bar in the progress breakdown (Experiments / Quizzes / Reports). */
export interface DashboardProgressTrack {
  key: "experiments" | "quizzes" | "reports";
  label: string;
  completed: number;
  total: number;
  /** Percentage 0-100, 0 when there is nothing to track. */
  percent: number;
}

export type ActivityType = "experiment" | "quiz" | "report";

/** A single entry in the recent activity feed. */
export interface DashboardActivityItem {
  id: string;
  type: ActivityType;
  /** Primary line, e.g. "Ohm's Law Experiment". */
  title: string;
  /** Secondary line, e.g. "Quiz passed with 83%". */
  description: string;
  /** ISO date string of when the activity happened. */
  timestamp: string;
  /** Route to open when the entry is clicked. */
  href: string;
}

/** Snapshot of one locally stored quiz attempt. */
export interface QuizAttemptSummary {
  experiment_id: string;
  experiment_title: string;
  /** Percentage 0-100. */
  score: number;
  correct_answers: number;
  total_questions: number;
  status: QuizStatus;
  /** ISO date string. */
  submitted_at: string;
}

/** An experiment suggestion with the reason it was picked. */
export interface DashboardRecommendation {
  experiment: Experiment;
  reason: string;
}

/** Everything the dashboard renders, assembled by dashboardService. */
export interface DashboardData {
  kpis: DashboardKpis;
  progress: DashboardProgressTrack[];
  activity: DashboardActivityItem[];
  /** Most recent in-progress experiment, null when nothing is started. */
  continueLearning: Experiment | null;
  nextRecommended: DashboardRecommendation[];
  quizAttempts: QuizAttemptSummary[];
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  experiment: "Experiment",
  quiz: "Quiz",
  report: "Report",
};
