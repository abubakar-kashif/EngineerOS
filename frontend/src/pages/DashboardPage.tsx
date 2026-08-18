import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import { getProgress, type ProgressSummary } from "../services/progressService";

function DashboardPage() {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProgress();
        setProgress(data);
      } catch (err) {
        console.error("Failed to load progress:", err);
        setError("Unable to load your progress.");
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  if (loading) {
    return (
      <main className="page-container">
        <LoadingState message="Loading dashboard..." />
      </main>
    );
  }

  if (error || !progress) {
    return (
      <main className="page-container">
        <ErrorState message={error ?? "Progress data is unavailable."} />
      </main>
    );
  }

  return (
    <main className="page-container">
      <section className="details-header">
        <div className="details-header-content">
          <p className="eyebrow">DASHBOARD</p>
          <h1>Your Learning Progress</h1>
          <p className="details-description">
            Track your experiment and quiz progress in EngineerOS.
          </p>
        </div>
      </section>

      <section className="details-section">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="details-card-content">
              <p className="eyebrow">EXPERIMENTS</p>
              <h2>{progress.completed_experiments}</h2>
              <p>Completed experiments</p>
            </div>
          </Card>

          <Card>
            <div className="details-card-content">
              <p className="eyebrow">QUIZZES</p>
              <h2>{progress.completed_quizzes}</h2>
              <p>Completed quizzes</p>
            </div>
          </Card>

          <Card>
            <div className="details-card-content">
              <p className="eyebrow">AVERAGE SCORE</p>
              <h2>{progress.average_quiz_score}%</h2>
              <p>Average quiz score</p>
            </div>
          </Card>

          <Card>
            <div className="details-card-content">
              <p className="eyebrow">OVERALL</p>
              <h2>{progress.overall_progress}%</h2>
              <p>Overall progress</p>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

export default DashboardPage;