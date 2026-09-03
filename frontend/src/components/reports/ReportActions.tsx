import { Download, Printer, FileJson } from "lucide-react";
import Button from "../ui/Button";
import { downloadReport, exportReport } from "../../services/reports/reportsService";
import type { Report } from "../../types/reports";

type ReportActionsProps = {
  report: Report;
};

/**
 * Download generates a real text report file, Export writes the structured
 * JSON data, and Print opens the browser print dialog for the current page.
 * No action pretends a server-side PDF exists.
 */
function ReportActions({ report }: ReportActionsProps) {
  const downloadable = report.status !== "processing" && report.status !== "failed";

  return (
    <div className="report-actions">
      <Button
        variant="primary"
        size="sm"
        icon={<Download size={14} />}
        disabled={!downloadable}
        onClick={() => downloadReport(report)}
      >
        Download Report
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon={<FileJson size={14} />}
        disabled={!downloadable}
        onClick={() => exportReport(report)}
      >
        Export
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={<Printer size={14} />}
        onClick={() => window.print()}
      >
        Print
      </Button>
    </div>
  );
}

export default ReportActions;
