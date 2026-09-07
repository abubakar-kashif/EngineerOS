import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  Calculator,
  CalendarDays,
  CheckCircle2,
  CircuitBoard,
  Cpu,
  Eye,
  FileText,
  FlaskConical,
  GraduationCap,
  History,
  ListOrdered,
  Percent,
  Ruler,
  Sigma,
  Target,
  User,
} from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import ReportActions from "../../components/reports/ReportActions";
import { getReport } from "../../services/reports/reportsService";
import { ApiError } from "../../services/api";
import type {
  Report,
  ReportCalculatedRow,
  ReportPercentageErrorRow,
  ReportQuizPerformance,
  ReportValueRow,
} from "../../types/reports";
import { REPORT_STATUS_LABELS, REPORT_STATUS_VARIANTS } from "../../types/reports";

const valueFormatter = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 });

function formatValue(value: number): string {
  return valueFormatter.format(value);
}

/** Error tone: matching values are "ok", small drift "warn", large "high". */
function errorTone(pct: number): "ok" | "warn" | "high" {
  if (pct <= 2) return "ok";
  if (pct <= 5) return "warn";
  return "high";
}

function hasText(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Date not recorded";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ReportSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="report-section">
      <h2 className="report-section-title">
        <span className="report-section-icon" aria-hidden="true">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Honest placeholder for data the report genuinely does not have. */
function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="report-empty">{children}</p>;
}

function ReportDetailSkeleton() {
  return (
    <div className="report-detail-skeleton" aria-hidden="true">
      <div className="ui-skeleton" style={{ width: 220, height: 13, borderRadius: 7 }} />
      <div className="ui-skeleton" style={{ width: "48%", height: 30, marginTop: 18, borderRadius: 9 }} />
      <div className="ui-skeleton ui-skeleton-text" style={{ width: "34%", height: 12, marginTop: 12 }} />
      <div className="ui-skeleton" style={{ width: 300, height: 38, marginTop: 24, borderRadius: 10 }} />
      <div className="ui-skeleton" style={{ width: "100%", height: 130, marginTop: 28, borderRadius: 16 }} />
      <div className="ui-skeleton" style={{ width: "100%", height: 240, marginTop: 14, borderRadius: 16 }} />
      <div className="ui-skeleton" style={{ width: "100%", height: 130, marginTop: 14, borderRadius: 16 }} />
    </div>
  );
}

function ValueRowsTable({ rows }: { rows: ReportValueRow[] }) {
  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead>
          <tr>
            <th scope="col">Quantity</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="report-table-label">{row.label}</td>
              <td>
                {formatValue(row.value)} {row.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalculatedResultsSection({ rows }: { rows: ReportCalculatedRow[] }) {
  return (
    <ReportSection icon={<Calculator size={16} />} title="Calculated Results">
      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th scope="col">Quantity</th>
              <th scope="col">Value</th>
              <th scope="col">Formula</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="report-table-label">{row.label}</td>
                <td>
                  {formatValue(row.value)} {row.unit}
                </td>
                <td>
                  <code className="report-formula">{row.formula}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

function PercentageErrorSection({ rows }: { rows: ReportPercentageErrorRow[] }) {
  const errors = rows.map((row) => row.error_percent);
  const avgError = errors.reduce((sum, value) => sum + value, 0) / errors.length;
  const maxError = Math.max(...errors);

  return (
    <ReportSection icon={<Percent size={16} />} title="Percentage Error">
      <div className="report-metrics">
        <div className="report-metric">
          <span className="report-metric-value">{rows.length}</span>
          <span className="report-metric-label">Quantities compared</span>
        </div>
        <div className="report-metric">
          <span className="report-metric-value">{avgError.toFixed(1)}%</span>
          <span className="report-metric-label">Average error</span>
        </div>
        <div className="report-metric">
          <span className="report-metric-value">{maxError.toFixed(1)}%</span>
          <span className="report-metric-label">Largest error</span>
        </div>
      </div>

      <div className="report-table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th scope="col">Quantity</th>
              <th scope="col">Theoretical</th>
              <th scope="col">Measured</th>
              <th scope="col">Difference</th>
              <th scope="col">Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tone = errorTone(row.error_percent);
              const barWidth = Math.min(100, (row.error_percent / 5) * 100);
              const difference = row.measured - row.theoretical;

              return (
                <tr key={row.label}>
                  <td className="report-table-label">{row.label}</td>
                  <td>
                    {formatValue(row.theoretical)} {row.unit}
                  </td>
                  <td>
                    {formatValue(row.measured)} {row.unit}
                  </td>
                  <td>
                    {difference > 0 ? "+" : ""}
                    {formatValue(difference)} {row.unit}
                  </td>
                  <td>
                    <div className={`report-dev report-dev--${tone}`}>
                      <span className="report-dev-track" aria-hidden="true">
                        <span className="report-dev-fill" style={{ width: `${barWidth}%` }} />
                      </span>
                      <span className="report-dev-value">{row.error_percent.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ReportSection>
  );
}

function QuizPerformanceSection({ performance }: { performance: ReportQuizPerformance }) {
  return (
    <ReportSection icon={<GraduationCap size={16} />} title="Quiz Performance">
      <div className="report-quiz">
        <div className="report-quiz-score">
          <span className="report-quiz-score-value">{performance.score}%</span>
          <Badge variant={performance.passed ? "success" : "danger"} size="sm">
            {performance.passed ? "Passed" : "Not passed"}
          </Badge>
        </div>
        <p className="report-quiz-detail">
          {performance.correct_answers} of {performance.total_questions} questions answered correctly.
        </p>
      </div>
    </ReportSection>
  );
}

function ReportDetailsPage() {
  const { reportId } = useParams<{ reportId: string }>();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!reportId) return;
    const id = reportId;
    let cancelled = false;

    async function load() {
      setFailed(false);
      setNotFound(false);
      setLoading(true);

      try {
        const data = await getReport(id);
        if (!cancelled) setReport(data);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) setNotFound(true);
        else setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reportId, reloadKey]);

  if (!reportId || notFound) {
    return (
      <div className="page report-detail-page">
        <EmptyState
          icon={<FileText size={28} />}
          title="Report not found"
          description="This report doesn't exist or has been removed."
          action={
            <Button variant="secondary" to="/reports">
              Back to Reports
            </Button>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page report-detail-page">
        <ReportDetailSkeleton />
      </div>
    );
  }

  if (failed || !report) {
    return (
      <div className="page report-detail-page">
        <ErrorState
          title="Unable to load this report."
          description="Something went wrong while retrieving the report."
          retryAction={() => setReloadKey((key) => key + 1)}
          retryLabel="Try Again"
        />
      </div>
    );
  }

  // Prefer fields stored on the report — do not invent catalog content.
  const objective = report.objective ?? null;
  const theory = report.theory ?? null;
  const historicalBackground = report.historical_background ?? null;
  const components = report.components ?? null;
  const circuitDiagram = report.circuit_diagram ?? null;
  const procedure = report.procedure ?? null;
  const theoretical = report.theoretical_results;

  return (
    <div className="page report-detail-page">
      <nav className="report-breadcrumb" aria-label="Breadcrumb">
        <Link to="/reports">Reports</Link>
        <span className="report-bc-sep" aria-hidden="true">/</span>
        <Link to={`/experiments/${report.experiment_id}`}>{report.experiment_title}</Link>
        <span className="report-bc-sep" aria-hidden="true">/</span>
        <span className="report-bc-current">{report.type}</span>
      </nav>

      <header className="report-detail-header">
        <div className="report-detail-heading">
          <div className="report-detail-title-row">
            <h1 className="report-detail-title">{report.title}</h1>
            <Badge variant={REPORT_STATUS_VARIANTS[report.status]}>
              {REPORT_STATUS_LABELS[report.status]}
            </Badge>
          </div>
          <div className="report-detail-meta">
            <span className="report-detail-chip">
              <User size={13} /> {report.student_name ?? "Anonymous"}
            </span>
            <span className="report-detail-chip">
              <FlaskConical size={13} /> {report.experiment_title}
            </span>
            <span className="report-detail-chip">
              <CalendarDays size={13} /> {formatDate(report.created_at)}
            </span>
            <span className="report-detail-chip">{report.type}</span>
          </div>
        </div>

        <div className="report-detail-toolbar">
          <ReportActions report={report} />
          <Button variant="ghost" size="sm" to={`/experiments/${report.experiment_id}`}>
            Open Experiment
          </Button>
        </div>
      </header>

      {report.status === "processing" && (
        <div className="report-notice report-notice--info" role="status">
          This report is still being generated. Measurements and quiz performance will appear once
          processing completes.
        </div>
      )}

      {report.status === "failed" && (
        <div className="report-notice report-notice--danger" role="alert">
          Report generation failed. The observations below describe what went wrong.
        </div>
      )}

      <div className="report-sections">
        {hasText(objective) && (
          <ReportSection icon={<Target size={16} />} title="Objective">
            <p className="report-text">{objective}</p>
          </ReportSection>
        )}

        {hasText(historicalBackground) && (
          <ReportSection icon={<History size={16} />} title="Historical Background">
            <p className="report-text">{historicalBackground}</p>
          </ReportSection>
        )}

        {hasText(theory) && (
          <ReportSection icon={<BookOpen size={16} />} title="Theory">
            <p className="report-text">{theory}</p>
          </ReportSection>
        )}

        {components && components.length > 0 && (
          <ReportSection icon={<Cpu size={16} />} title="Components">
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th scope="col">Component</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Specification</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((component) => (
                    <tr key={component.name}>
                      <td className="report-table-label">{component.name}</td>
                      <td>× {component.quantity}</td>
                      <td>{component.spec ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>
        )}

        {circuitDiagram && (
          <ReportSection icon={<CircuitBoard size={16} />} title="Circuit Diagram">
            <pre className="report-diagram">{circuitDiagram.art}</pre>
            {circuitDiagram.caption && (
              <p className="report-diagram-caption">{circuitDiagram.caption}</p>
            )}
          </ReportSection>
        )}

        {procedure && procedure.length > 0 && (
          <ReportSection icon={<ListOrdered size={16} />} title="Procedure">
            <ol className="report-procedure">
              {procedure.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </ReportSection>
        )}

        {theoretical && (
          <ReportSection icon={<Sigma size={16} />} title="Theoretical Results">
            {theoretical.reference_values && theoretical.reference_values.length > 0 ? (
              <>
                <h3 className="report-subsection-title">Reference Values</h3>
                <ValueRowsTable rows={theoretical.reference_values} />
              </>
            ) : null}
            {theoretical.expected_outcomes && theoretical.expected_outcomes.length > 0 ? (
              <>
                <h3 className="report-subsection-title">Expected Outcomes</h3>
                <ul className="report-outcomes">
                  {theoretical.expected_outcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </ReportSection>
        )}

        <ReportSection icon={<Ruler size={16} />} title="Measured Results">
          {report.measured_results && report.measured_results.length > 0 ? (
            <ValueRowsTable rows={report.measured_results} />
          ) : (
            <EmptyNote>
              No measurements recorded. Run a simulation for this experiment to attach measured
              values.
            </EmptyNote>
          )}
        </ReportSection>

        {report.calculated_results && report.calculated_results.length > 0 ? (
          <CalculatedResultsSection rows={report.calculated_results} />
        ) : (
          <ReportSection icon={<Calculator size={16} />} title="Calculated Results">
            <EmptyNote>Not calculated — requires measured source voltage and current.</EmptyNote>
          </ReportSection>
        )}

        {report.percentage_error && report.percentage_error.length > 0 ? (
          <PercentageErrorSection rows={report.percentage_error} />
        ) : (
          <ReportSection icon={<Percent size={16} />} title="Percentage Error">
            <EmptyNote>
              No comparison available — requires both reference and measured values.
            </EmptyNote>
          </ReportSection>
        )}

        <ReportSection icon={<Eye size={16} />} title="Observations">
          {hasText(report.observations) ? (
            <p className="report-text">{report.observations}</p>
          ) : (
            <EmptyNote>No observations recorded.</EmptyNote>
          )}
        </ReportSection>

        {report.quiz_performance ? (
          <QuizPerformanceSection performance={report.quiz_performance} />
        ) : (
          <ReportSection icon={<GraduationCap size={16} />} title="Quiz Performance">
            <EmptyNote>No quiz attempt recorded for this experiment.</EmptyNote>
          </ReportSection>
        )}

        <ReportSection icon={<CheckCircle2 size={16} />} title="Conclusion">
          {hasText(report.conclusion) ? (
            <p className="report-text">{report.conclusion}</p>
          ) : (
            <EmptyNote>No conclusion recorded.</EmptyNote>
          )}
        </ReportSection>
      </div>
    </div>
  );
}

export default ReportDetailsPage;
