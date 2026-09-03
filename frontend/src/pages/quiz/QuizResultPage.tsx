import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { ClipboardCheck, RotateCcw } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import QuizReview from "../../components/quiz/QuizReview";
import { clearQuizResult, getExperimentMeta, loadQuizResult } from "../../services/quiz/quizService";
import type { Experiment } from "../../types/experiment";
import type { QuizResult, QuizStatus } from "../../types/quiz";
import { QUIZ_STATUS_LABELS, QUIZ_STATUS_MESSAGES } from "../../types/quiz";

function statusVariant(status: QuizStatus): "success" | "primary" | "warning" | "danger" {
  switch (status) {
    case "excellent":
      return "success";
    case "passed":
      return "primary";
    case "needs_review":
      return "warning";
    default:
      return "danger";
  }
}

function QuizResultPage() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const reviewRef = useRef<HTMLDivElement>(null);

  // Prefer the freshly submitted result passed through router state; fall back
  // to the stored result so a refresh does not lose the outcome.
  const [result] = useState<QuizResult | null>(() => {
    const state = location.state as { result?: QuizResult } | null;
    if (state?.result) return state.result;
    return experimentId ? loadQuizResult(experimentId) : null;
  });

  const [experiment, setExperiment] = useState<Experiment | null>(null);

  useEffect(() => {
    if (!experimentId) return;
    const id = experimentId;
    let cancelled = false;
    async function load() {
      const meta = await getExperimentMeta(id);
      if (!cancelled) setExperiment(meta);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [experimentId]);

  if (!experimentId || !result) {
    return <Navigate to={experimentId ? `/quiz/${experimentId}` : "/quiz"} replace />;
  }

  const scorePct = Math.round(result.score);

  const retakeQuiz = () => {
    clearQuizResult(experimentId);
    navigate(`/quiz/${experimentId}`);
  };

  function scrollToReview() {
    reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="page quiz-page">
      <nav className="quiz-breadcrumb" aria-label="Breadcrumb">
        <Link to="/experiments">Experiments</Link>
        <span className="quiz-bc-sep" aria-hidden="true">/</span>
        <Link to={`/experiments/${experimentId}`}>
          {experiment?.title ?? experimentId}
        </Link>
        <span className="quiz-bc-sep" aria-hidden="true">/</span>
        <Link to={`/quiz/${experimentId}`}>Knowledge Check</Link>
        <span className="quiz-bc-sep" aria-hidden="true">/</span>
        <span className="quiz-bc-current">Result</span>
      </nav>

      <section className="quiz-result-hero" aria-labelledby="quiz-result-title">
        <div
          className="quiz-result-ring"
          role="img"
          aria-label={`Score ${scorePct}%`}
          style={{ background: `conic-gradient(var(--color-primary) ${scorePct}%, var(--color-surface-muted) ${scorePct}%)` }}
        >
          <div className="quiz-result-ring-inner">
            <span className="quiz-result-score-value">
              {result.correct_answers}
              <span className="quiz-result-score-total">/{result.total_questions}</span>
            </span>
            <span className="quiz-result-score-pct">{scorePct}%</span>
          </div>
        </div>

        <div className="quiz-result-hero-info">
          <h1 className="quiz-result-title" id="quiz-result-title">
            Quiz Complete
          </h1>
          <div className="quiz-result-status">
            <Badge variant={statusVariant(result.status)}>
              {QUIZ_STATUS_LABELS[result.status]}
            </Badge>
            {result.graded_by === "api" ? (
              <span className="quiz-result-graded">Graded by EngineerOS</span>
            ) : (
              <span className="quiz-result-graded">Graded locally</span>
            )}
          </div>
          <p className="quiz-result-message">{QUIZ_STATUS_MESSAGES[result.status]}</p>

          <div className="quiz-result-actions">
            <Button variant="primary" icon={<ClipboardCheck size={15} />} onClick={scrollToReview}>
              Review Answers
            </Button>
            <Button variant="secondary" icon={<RotateCcw size={15} />} onClick={retakeQuiz}>
              Retake Quiz
            </Button>
            <Button variant="ghost" to={`/experiments/${experimentId}`}>
              Back to Experiment
            </Button>
          </div>
        </div>
      </section>

      <section className="quiz-result-stats" aria-label="Result breakdown">
        <div className="quiz-result-stat">
          <span className="quiz-result-stat-value quiz-result-stat-value--success">
            {result.correct_answers}
          </span>
          <span className="quiz-result-stat-label">Correct answers</span>
        </div>
        <div className="quiz-result-stat">
          <span className="quiz-result-stat-value quiz-result-stat-value--danger">
            {result.incorrect_answers}
          </span>
          <span className="quiz-result-stat-label">Incorrect answers</span>
        </div>
        <div className="quiz-result-stat">
          <span className="quiz-result-stat-value">{result.unanswered}</span>
          <span className="quiz-result-stat-label">Unanswered</span>
        </div>
        <div className="quiz-result-stat">
          <span className="quiz-result-stat-value">{scorePct}%</span>
          <span className="quiz-result-stat-label">Score</span>
        </div>
      </section>

      <div ref={reviewRef} className="quiz-result-review">
        <h2 className="quiz-result-review-title">Review answers</h2>
        <p className="quiz-result-review-subtitle">
          Every question with your answer, the correct answer, and the reasoning behind it.
        </p>
        <QuizReview feedback={result.feedback} />
      </div>
    </div>
  );
}

export default QuizResultPage;
