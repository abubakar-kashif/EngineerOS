import { useState } from "react";
import { FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { createReport } from "../../services/reports/reportsService";

interface ReportCTAProps {
  experimentId: string;
  experimentTitle: string;
}

function ReportCTA({ experimentId, experimentTitle }: ReportCTAProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [observations, setObservations] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setSubmitting(true);
    setError(null);
    try {
      const report = await createReport({
        experiment_id: experimentId,
        title: `Lab Report — ${experimentTitle}`,
        observations: observations.trim(),
        conclusion: conclusion.trim(),
      });
      navigate(`/reports/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate the report.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="detail-cta-card detail-cta-report">
      <div className="detail-cta">
        <FileText size={24} className="detail-cta-icon" />
        <p className="eyebrow">DOCUMENT YOUR WORK</p>
        <h2 className="detail-cta-title">Generate Report</h2>
        <p className="detail-cta-desc">
          Create a professional lab report with your observations and conclusion.
          {!isAuthenticated &&
            " Sign in to attach your simulation measurements and quiz results."}
        </p>
        <div className="report-cta-form">
          <div className="ui-field">
            <label htmlFor="report-observations" className="ui-field-label">
              Observations
            </label>
            <textarea
              id="report-observations"
              className="ui-textarea"
              placeholder="What did you observe during the experiment?"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              maxLength={10000}
            />
          </div>
          <div className="ui-field">
            <label htmlFor="report-conclusion" className="ui-field-label">
              Conclusion
            </label>
            <textarea
              id="report-conclusion"
              className="ui-textarea"
              placeholder="What did you conclude from the results?"
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              rows={3}
              maxLength={10000}
            />
          </div>
          {error && (
            <p className="report-cta-error" role="alert">
              {error}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            loading={submitting}
            icon={<ArrowRight size={16} />}
            iconPosition="right"
          >
            {submitting ? "Generating…" : "Generate Report"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ReportCTA;
