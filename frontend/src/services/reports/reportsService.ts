import { apiRequest } from "../api";
import { mockExperiments } from "../../data/mockExperiments";
import type {
  Report,
  ReportCalculatedRow,
  ReportPercentageErrorRow,
  ReportStatus,
  ReportTheoreticalResults,
  ReportValueRow,
} from "../../types/reports";

interface ApiReport {
  id: number;
  user_id: string | null;
  experiment_id: string;
  experiment_title?: string | null;
  student_name?: string | null;
  title: string;
  objective?: string | null;
  theory?: string | null;
  historical_background?: string | null;
  components?: Report["components"];
  circuit_diagram?: Report["circuit_diagram"];
  procedure?: string[] | null;
  theoretical_results?: ReportTheoreticalResults | null;
  measured_results?: ReportValueRow[] | null;
  calculated_results?: ReportCalculatedRow[] | null;
  percentage_error?: ReportPercentageErrorRow[] | null;
  quiz_performance?: Report["quiz_performance"];
  observations: string;
  conclusion: string;
  status: string;
  created_at: string | null;
}

interface CreateReportRequest {
  experiment_id: string;
  title: string;
  observations: string;
  conclusion: string;
}

function experimentTitle(experimentId: string): string {
  return mockExperiments.find((e) => e.id === experimentId)?.title ?? experimentId;
}

function mapApiStatus(status: string): ReportStatus {
  switch (status) {
    case "draft":
    case "in_progress":
    case "completed":
    case "processing":
    case "failed":
      return status;
    // The backend creates reports with status "generated".
    case "generated":
    default:
      return "completed";
  }
}

function normalizeApiReport(raw: ApiReport): Report {
  return {
    id: String(raw.id),
    experiment_id: raw.experiment_id,
    experiment_title: raw.experiment_title || experimentTitle(raw.experiment_id),
    student_name: raw.student_name ?? null,
    title: raw.title,
    type: "Lab Report",
    status: mapApiStatus(raw.status),
    created_at: raw.created_at ?? null,
    score: null,
    observations: raw.observations,
    conclusion: raw.conclusion,
    summary: null,
    objective: raw.objective ?? null,
    theory: raw.theory ?? null,
    historical_background: raw.historical_background ?? null,
    components: raw.components ?? null,
    circuit_diagram: raw.circuit_diagram ?? null,
    procedure: raw.procedure ?? null,
    theoretical_results: raw.theoretical_results ?? null,
    measured_results: raw.measured_results ?? null,
    calculated_results: raw.calculated_results ?? null,
    percentage_error: raw.percentage_error ?? null,
    quiz_performance: raw.quiz_performance ?? null,
    source: "api",
  };
}

/** Lists the signed-in user's reports from the backend. */
export async function getReports(): Promise<Report[]> {
  const raw = await apiRequest<ApiReport[]>("/reports");
  return raw.map(normalizeApiReport);
}

/** Loads a single report by id from the backend. */
export async function getReport(reportId: string): Promise<Report> {
  const raw = await apiRequest<ApiReport>(`/reports/${encodeURIComponent(reportId)}`);
  return normalizeApiReport(raw);
}

/** Creates a report through the backend API (existing endpoint). */
export async function createReport(data: CreateReportRequest): Promise<Report> {
  const raw = await apiRequest<ApiReport>("/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeApiReport(raw);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatRows(rows: ReportValueRow[]): string {
  return rows
    .map((row) => `  - ${row.label}: ${row.value} ${row.unit}`)
    .join("\n");
}

function formatCalculated(rows: ReportCalculatedRow[]): string {
  return rows
    .map((row) => `  - ${row.label}: ${row.value} ${row.unit}  (${row.formula})`)
    .join("\n");
}

function formatPercentageError(rows: ReportPercentageErrorRow[]): string {
  return rows
    .map(
      (row) =>
        `  - ${row.label}: theoretical ${row.theoretical} ${row.unit}, ` +
        `measured ${row.measured} ${row.unit}, error ${row.error_percent.toFixed(2)}%`,
    )
    .join("\n");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Exports the report as a formatted text file mirroring the lab-document
 * structure. This generates a real file — no PDF pretend-download. When
 * server-side PDF generation lands, this swaps for the API download
 * endpoint behind the same boundary.
 */
export function downloadReport(report: Report): void {
  const theoretical = report.theoretical_results;
  const lines: string[] = [
    "ENGINEEROS — LAB REPORT",
    "=======================",
    "",
    `Student:      ${report.student_name ?? "Anonymous"}`,
    `Experiment:   ${report.experiment_title} (${report.experiment_id})`,
    `Date:         ${report.created_at ? new Date(report.created_at).toLocaleDateString() : "Not recorded"}`,
    `Title:        ${report.title}`,
    `Status:       ${report.status}`,
    "",
    "OBJECTIVE",
    report.objective || "Not recorded.",
    "",
    "HISTORICAL BACKGROUND",
    report.historical_background || "Not recorded.",
    "",
    "THEORY",
    report.theory || "Not recorded.",
    "",
    "COMPONENTS",
    report.components && report.components.length > 0
      ? report.components
          .map((c) => `  - ${c.name} × ${c.quantity}${c.spec ? ` (${c.spec})` : ""}`)
          .join("\n")
      : "Not recorded.",
    "",
    "CIRCUIT DIAGRAM",
    report.circuit_diagram?.art ?? "Not recorded.",
    report.circuit_diagram?.caption ?? "",
    "",
    "PROCEDURE",
    report.procedure && report.procedure.length > 0
      ? report.procedure.map((step, i) => `${i + 1}. ${step}`).join("\n")
      : "Not recorded.",
    "",
    "THEORETICAL RESULTS",
    theoretical?.reference_values && theoretical.reference_values.length > 0
      ? formatRows(theoretical.reference_values)
      : "  No reference values recorded.",
    theoretical?.expected_outcomes && theoretical.expected_outcomes.length > 0
      ? theoretical.expected_outcomes.map((outcome) => `  - ${outcome}`).join("\n")
      : "",
    "",
    "MEASURED RESULTS",
    report.measured_results && report.measured_results.length > 0
      ? formatRows(report.measured_results)
      : "No measurements recorded.",
    "",
    "CALCULATED RESULTS",
    report.calculated_results && report.calculated_results.length > 0
      ? formatCalculated(report.calculated_results)
      : "Not calculated — requires measured voltage and current.",
    "",
    "PERCENTAGE ERROR",
    report.percentage_error && report.percentage_error.length > 0
      ? formatPercentageError(report.percentage_error)
      : "No comparison available — requires both reference and measured values.",
    "",
    "OBSERVATIONS",
    report.observations || "No observations recorded.",
    "",
    "QUIZ PERFORMANCE",
    report.quiz_performance
      ? `Score ${report.quiz_performance.score}% — ` +
        `${report.quiz_performance.correct_answers}/${report.quiz_performance.total_questions} correct ` +
        `(${report.quiz_performance.passed ? "passed" : "not passed"})`
      : "No quiz result recorded.",
    "",
    "CONCLUSION",
    report.conclusion || "No conclusion recorded.",
    "",
    `Generated by EngineerOS on ${new Date().toLocaleString()}.`,
  ];

  triggerDownload(
    new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }),
    `${slugify(report.title)}-report.txt`,
  );
}

/** Exports the raw report data as a JSON file. */
export function exportReport(report: Report): void {
  triggerDownload(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    `${slugify(report.title)}-report.json`,
  );
}
