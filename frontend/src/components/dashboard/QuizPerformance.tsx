import { Link } from "react-router-dom";
import { ClipboardCheck, History } from "lucide-react";
import { formatRelativeTime } from "../../services/dashboard/dashboardService";
import type { QuizAttemptSummary } from "../../types/dashboard";

/** How many recent attempts the panel lists. */
const MAX_ROWS = 5;

type QuizPerformanceProps = {
  attempts: QuizAttemptSummary[];
};

/**
 * "How are my knowledge checks going?" — the latest graded attempts with
 * scores and outcomes, backed by the persisted quiz history.
 */
function QuizPerformance({ attempts }: QuizPerformanceProps) {
  const passedCount = attempts.filter(
    (attempt) => attempt.status === "passed" || attempt.status === "excellent",
  ).length;
  const recent = attempts.slice(0, MAX_ROWS);

  return (
    <section className="dashboard-panel" aria-label="Quiz performance">
      <div className="dashboard-panel-head">
        <h2 className="dashboard-panel-title">Quiz performance</h2>
        <span className="dashboard-panel-hint">
          {attempts.length} {attempts.length === 1 ? "attempt" : "attempts"} · {passedCount} passed
        </span>
      </div>

      {recent.length === 0 ? (
        <p className="dashboard-activity-empty">
          Take a knowledge check to see your scores here.
        </p>
      ) : (
        <ul className="dashboard-activity-list">
          {recent.map((attempt) => (
            <li key={`${attempt.experiment_id}-${attempt.submitted_at}`}>
              <Link
                to={`/quiz/${attempt.experiment_id}/result`}
                className="dashboard-activity-item"
                title={attempt.experiment_title}
              >
                <span className="dashboard-activity-icon">
                  <ClipboardCheck size={16} />
                </span>
                <span className="dashboard-activity-body">
                  <span className="dashboard-activity-title">{attempt.experiment_title}</span>
                  <span className="dashboard-activity-description">
                    Scored {attempt.score}% ({attempt.correct_answers}/{attempt.total_questions} correct)
                  </span>
                </span>
                <span className="dashboard-activity-time">
                  {formatRelativeTime(attempt.submitted_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="dashboard-panel-foot">
        <Link to="/quiz" className="dashboard-panel-link">
          <History size={13} /> View all quizzes
        </Link>
      </div>
    </section>
  );
}

export default QuizPerformance;
