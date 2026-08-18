import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import {
  createReport,
  getReports,
  type Report,
} from "../services/reportService";

function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [experimentId, setExperimentId] = useState("");
  const [title, setTitle] = useState("");
  const [observations, setObservations] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadReports() {
    try {
      setLoading(true);
      setError(null);

      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function handleCreateReport() {
    if (!experimentId.trim() || !title.trim()) {
      setError("Experiment ID and title are required.");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      await createReport({
        experiment_id: experimentId.trim(),
        title: title.trim(),
        observations,
        conclusion,
      });

      setExperimentId("");
      setTitle("");
      setObservations("");
      setConclusion("");

      await loadReports();
    } catch (err) {
      console.error("Failed to create report:", err);
      setError("Unable to create report.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <LoadingState message="Loading reports..." />
      </main>
    );
  }

  return (
    <main className="page-container">
      <section className="details-header">
        <div className="details-header-content">
          <p className="eyebrow">REPORTS</p>
          <h1>Experiment Reports</h1>
          <p className="details-description">
            Create and review reports for completed experiments.
          </p>
        </div>
      </section>

      {error && (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      )}

      <section className="details-section">
        <Card>
          <div className="details-card-content">
            <p className="eyebrow">NEW REPORT</p>
            <h2>Create Experiment Report</h2>

            <div className="mt-5 space-y-4">
              <input
                value={experimentId}
                onChange={(e) => setExperimentId(e.target.value)}
                placeholder="Experiment ID, e.g. ohms-law"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Report title"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observations"
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                placeholder="Conclusion"
                rows={5}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <Button
                type="button"
                variant="primary"
                onClick={handleCreateReport}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Report"}
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="details-section">
        <p className="eyebrow">SAVED REPORTS</p>
        <h2 className="mb-5 text-2xl font-bold text-slate-900">
          Your Reports
        </h2>

        {reports.length === 0 ? (
          <Card>
            <div className="details-card-content">
              <p>No reports have been created yet.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <div className="details-card-content">
                  <p className="eyebrow">{report.experiment_id}</p>
                  <h2>{report.title}</h2>

                  <p className="mt-3">
                    <strong>Status:</strong> {report.status}
                  </p>

                  <p className="mt-3">
                    <strong>Observations:</strong>{" "}
                    {report.observations || "—"}
                  </p>

                  <p className="mt-3">
                    <strong>Conclusion:</strong>{" "}
                    {report.conclusion || "—"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default ReportsPage;