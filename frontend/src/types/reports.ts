export type ReportStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "processing"
  | "failed";

/** A single measured or reference value: e.g. "Total Current", 0.009, "A". */
export interface ReportValueRow {
  label: string;
  value: number;
  unit: string;
}

/** A quantity derived from measured values, with the formula used. */
export interface ReportCalculatedRow extends ReportValueRow {
  formula: string;
}

/** |theoretical − measured| / theoretical × 100 for a comparable quantity. */
export interface ReportPercentageErrorRow {
  label: string;
  theoretical: number;
  measured: number;
  unit: string;
  error_percent: number;
}

/** Theoretical results: reference values from the experiment's simulation
 * brief plus the experiment's predicted outcomes. */
export interface ReportTheoreticalResults {
  reference_values: ReportValueRow[] | null;
  expected_outcomes: string[] | null;
}

export interface ReportExperimentComponent {
  name: string;
  quantity: number;
  spec: string | null;
}

export interface ReportCircuitDiagram {
  art: string;
  caption: string | null;
}

export interface ReportQuizPerformance {
  score: number;
  correct_answers: number;
  total_questions: number;
  passed: boolean;
}

export type ReportSource = "api";

export interface Report {
  id: string;
  experiment_id: string;
  experiment_title: string;
  student_name: string | null;
  title: string;
  /** e.g. "Lab Report" */
  type: string;
  status: ReportStatus;
  /** ISO date string, null when the source has no timestamp. */
  created_at: string | null;
  /** Overall percentage score, null when not graded yet. */
  score: number | null;
  observations: string;
  conclusion: string;
  /** Short narrative summary; null when not recorded. */
  summary: string | null;
  /** Content sections copied from the experiment at generation time. */
  objective: string | null;
  theory: string | null;
  historical_background: string | null;
  components: ReportExperimentComponent[] | null;
  circuit_diagram: ReportCircuitDiagram | null;
  /** Ordered procedure steps; null when not recorded. */
  procedure: string[] | null;
  theoretical_results: ReportTheoreticalResults | null;
  /** Data recorded from the user's own work; null when not recorded —
   * missing measurements are never fabricated. */
  measured_results: ReportValueRow[] | null;
  calculated_results: ReportCalculatedRow[] | null;
  percentage_error: ReportPercentageErrorRow[] | null;
  quiz_performance: ReportQuizPerformance | null;
  source: ReportSource;
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  processing: "Processing",
  failed: "Failed",
};

export const REPORT_STATUS_FILTERS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "processing", label: "Processing" },
  { value: "draft", label: "Draft" },
  { value: "failed", label: "Failed" },
];

/** Badge variant used to render each status consistently. */
export const REPORT_STATUS_VARIANTS: Record<
  ReportStatus,
  "success" | "info" | "warning" | "default" | "danger"
> = {
  completed: "success",
  in_progress: "info",
  processing: "warning",
  draft: "default",
  failed: "danger",
};
