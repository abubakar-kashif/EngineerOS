import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, FlaskConical } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import DashboardSkeleton from "../../components/dashboard/DashboardSkeleton";
import ProgressOverview from "../../components/dashboard/ProgressOverview";
import RecentActivity from "../../components/dashboard/RecentActivity";
import RecommendedExperiments from "../../components/dashboard/RecommendedExperiments";
import QuizPerformance from "../../components/dashboard/QuizPerformance";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardData, getGreeting } from "../../services/dashboard/dashboardService";
import type { DashboardData } from "../../types/dashboard";

function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dashboard = await getDashboardData();
        if (!cancelled) setData(dashboard);
      } catch {
        if (!cancelled) setError("We couldn't load your dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <main className="page dashboard-page">
        <ErrorState
          title="We couldn't load your dashboard."
          description="Check your connection and try again — your progress is safe."
          retryAction={() => setReloadKey((key) => key + 1)}
          retryLabel="Try Again"
        />
      </main>
    );
  }

  const { kpis, progress, activity, continueLearning, nextRecommended, quizAttempts } = data;
  const reportsDone = progress.find((track) => track.key === "reports")?.completed ?? 0;

  const isFreshStart =
    kpis.completed_experiments === 0 &&
    kpis.in_progress_experiments === 0 &&
    quizAttempts.length === 0 &&
    reportsDone === 0;

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <main className="page dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-copy">
          <h1 className="dashboard-greeting">
            {getGreeting(new Date())}, {firstName}.
          </h1>
          <p className="dashboard-tagline">
            Continue your engineering learning journey.
          </p>
        </div>
      </header>

      {isFreshStart ? (
        <EmptyState
          icon={<Compass size={28} />}
          title="Welcome to EngineerOS"
          description="You haven't started your first experiment yet. Pick a beginner-friendly lab, work through the procedure, and your progress will light up this dashboard."
          action={
            <Button variant="primary" to="/experiments" icon={<FlaskConical size={15} />}>
              Start Your First Experiment
            </Button>
          }
          className="dashboard-welcome"
        />
      ) : (
        <>
          <section className="dashboard-kpis" aria-label="Key learning metrics">
            <div className="dashboard-kpi">
              <span className="dashboard-kpi-value">{kpis.completed_experiments}</span>
              <span className="dashboard-kpi-label">Experiments completed</span>
            </div>
            <div className="dashboard-kpi">
              <span className="dashboard-kpi-value">{kpis.in_progress_experiments}</span>
              <span className="dashboard-kpi-label">In progress</span>
            </div>
            <div className="dashboard-kpi">
              <span className="dashboard-kpi-value">
                {kpis.average_quiz_score !== null ? `${kpis.average_quiz_score}%` : "—"}
              </span>
              <span className="dashboard-kpi-label">Average quiz score</span>
            </div>
            <div className="dashboard-kpi">
              <span className="dashboard-kpi-value">{kpis.overall_progress}%</span>
              <span className="dashboard-kpi-label">Learning progress</span>
            </div>
          </section>

          <div className="dashboard-grid-main">
            <ProgressOverview progress={progress} />
            <RecentActivity activity={activity} />
          </div>

          <RecommendedExperiments
            continueLearning={continueLearning}
            nextRecommended={nextRecommended}
          />

          <QuizPerformance attempts={quizAttempts} />

          <p className="dashboard-footer-note">
            Looking for your generated lab documents?{" "}
            <Link to="/reports">Open the reports page</Link>.
          </p>
        </>
      )}
    </main>
  );
}

export default DashboardPage;
