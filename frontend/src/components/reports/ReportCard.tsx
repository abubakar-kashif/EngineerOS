import { Calendar, Download, FileText } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { downloadReport } from "../../services/reports/reportsService";
import type { Report } from "../../types/reports";
import { REPORT_STATUS_LABELS, REPORT_STATUS_VARIANTS } from "../../types/reports";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type ReportCardProps = {
  report: Report;
};

function ReportCard({ report }: ReportCardProps) {
  const downloadable = report.status !== "processing" && report.status !== "failed";

  return (
    <article className="report-card">
      <div className="report-card-head">
        <span className="report-card-icon">
          <FileText size={17} />
        </span>
        <div className="report-card-titles">
          <h3 className="report-card-experiment">{report.experiment_title}</h3>
          <span className="report-card-type">{report.type}</span>
        </div>
        <Badge variant={REPORT_STATUS_VARIANTS[report.status]} size="sm">
          {REPORT_STATUS_LABELS[report.status]}
        </Badge>
      </div>

      <div className="report-card-meta">
        <span className="report-card-date">
          <Calendar size={13} /> {formatDate(report.created_at)}
        </span>
        <span className="report-card-score">
          {report.score !== null ? `Score: ${Math.round(report.score)}%` : "Score: —"}
        </span>
      </div>

      <p className="report-card-summary">
        {report.summary || report.observations || "No observations recorded yet."}
      </p>

      <div className="report-card-actions">
        <Button variant="secondary" size="sm" to={`/reports/${report.id}`}>
          View Report
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Download size={14} />}
          disabled={!downloadable}
          onClick={() => downloadReport(report)}
        >
          Download
        </Button>
      </div>
    </article>
  );
}

export default ReportCard;
