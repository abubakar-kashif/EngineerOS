import { useEffect, useMemo, useState } from "react";
import { FileText, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import SectionHeading from "../../components/ui/SectionHeading";
import ReportCard from "../../components/reports/ReportCard";
import ReportSkeleton from "../../components/reports/ReportSkeleton";
import { getReports } from "../../services/reports/reportsService";
import type { Report, ReportStatus } from "../../types/reports";
import { REPORT_STATUS_FILTERS } from "../../types/reports";

function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setFailed(false);
      setLoading(true);
      try {
        const data = await getReports();
        if (!cancelled) setReports(data);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (query) {
        const haystack = [
          report.title,
          report.experiment_title,
          report.type,
          report.observations,
          report.conclusion,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [reports, search, statusFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <div className="page report-page">
      <SectionHeading
        eyebrow="REPORTS"
        title="Reports"
        description="Your experiment reports and assessment results."
      />

      <div className="report-toolbar">
        <div className="report-search">
          <Input
            type="search"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={15} />}
            aria-label="Search reports"
          />
        </div>

        <div className="report-filters" role="group" aria-label="Filter reports by status">
          {REPORT_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`report-filter${
                statusFilter === filter.value ? " report-filter--active" : ""
              }`}
              aria-pressed={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="report-grid">
          {[0, 1, 2, 3].map((i) => (
            <ReportSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && failed && (
        <ErrorState
          title="Unable to load reports."
          retryAction={() => setReloadKey((key) => key + 1)}
          retryLabel="Try Again"
        />
      )}

      {!loading && !failed && reports.length === 0 && (
        <EmptyState
          icon={<FileText size={28} />}
          title="No reports yet"
          description="Complete an experiment to generate your first report."
          action={
            <Button variant="primary" to="/experiments">
              Explore Experiments
            </Button>
          }
        />
      )}

      {!loading && !failed && reports.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={<FileText size={28} />}
          title="No matching reports"
          description="No reports match your current search and filters."
          action={
            hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      )}

      {!loading && !failed && filtered.length > 0 && (
        <>
          <p className="report-count" aria-live="polite">
            Showing {filtered.length} of {reports.length} reports
          </p>
          <div className="report-grid">
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ReportsPage;
