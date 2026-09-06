import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ClipboardCheck, ClipboardList, Clock, ListChecks, Bookmark } from "lucide-react";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Dialog from "../../components/ui/Dialog";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import SectionHeading from "../../components/ui/SectionHeading";
import Spinner from "../../components/ui/Spinner";
import QuestionCard from "../../components/quiz/QuestionCard";
import QuizNavigation from "../../components/quiz/QuizNavigation";
import QuizSetup from "../../components/quiz/QuizSetup";
import QuizSkeleton from "../../components/quiz/QuizSkeleton";
import {
  clearQuizResult,
  getExperimentMeta,
  getQuizAvailability,
  getSeedQuestionCount,
  getSeedQuizIds,
  NO_QUIZ_ERROR,
  saveQuizResult,
  startQuiz,
  submitQuiz,
  type QuizAvailability,
} from "../../services/quiz/quizService";
import { mockExperiments } from "../../data/mockExperiments";
import { QUIZ_DIFFICULTY_LABELS } from "../../data/quiz/quizBank";
import type { QuizDifficultyLevel, QuizQuestionCount } from "../../data/quiz/quizDifficulty";
import type { Experiment, ExperimentDifficulty } from "../../types/experiment";
import type { AnswerLetter, Quiz, QuizAnswers } from "../../types/quiz";

function difficultyVariant(difficulty: ExperimentDifficulty): "success" | "warning" | "danger" {
  if (difficulty === "Beginner") return "success";
  if (difficulty === "Intermediate") return "warning";
  return "danger";
}

/** Index shown for /quiz without an experiment — lists assessments to start. */
function QuizIndex() {
  const quizIds = getSeedQuizIds();

  const experiments = useMemo(
    () => mockExperiments.filter((experiment) => quizIds.includes(experiment.id)),
    [quizIds],
  );

  return (
    <div className="page quiz-page">
      <SectionHeading
        eyebrow="ASSESSMENTS"
        title="Knowledge checks"
        description="Pick an experiment, then choose question count and difficulty before you start."
      />

      <div className="quiz-index-grid">
        {experiments.map((experiment) => {
          const bankSize = getSeedQuestionCount(experiment.id);

          return (
            <Link
              key={experiment.id}
              to={`/quiz/${experiment.id}`}
              className="quiz-index-card"
            >
              <div className="quiz-index-head">
                <span className="quiz-index-icon">
                  <ClipboardCheck size={17} />
                </span>
                <Badge variant={difficultyVariant(experiment.difficulty)} size="sm">
                  {experiment.difficulty}
                </Badge>
              </div>

              <h3 className="quiz-index-title">{experiment.title}</h3>
              <p className="quiz-index-description">{experiment.short_description}</p>

              <div className="quiz-index-meta">
                <span>
                  <ListChecks size={13} /> Setup 10 / 20 / 40 · Easy–Hard
                </span>
                <span>
                  <Clock size={13} /> Bank {bankSize}+
                </span>
              </div>

              <span className="quiz-index-cta">
                Configure quiz <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type QuizRunnerProps = {
  experimentId: string;
};

function QuizRunner({ experimentId }: QuizRunnerProps) {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<"setup" | "running">("setup");
  const [availability, setAvailability] = useState<QuizAvailability | null>(null);
  const [questionCount, setQuestionCount] = useState<QuizQuestionCount>(10);
  const [difficulty, setDifficulty] = useState<QuizDifficultyLevel>("easy");
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);
  const [noQuiz, setNoQuiz] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSetup() {
      setSetupLoading(true);
      setSetupError(null);
      setNoQuiz(false);
      setLoadFailed(false);
      clearQuizResult(experimentId);

      try {
        const [meta, availabilityData] = await Promise.all([
          getExperimentMeta(experimentId),
          getQuizAvailability(experimentId),
        ]);
        if (cancelled) return;
        setExperiment(meta);
        setAvailability(availabilityData);
        // Prefer the largest available count for the current difficulty.
        const pool = availabilityData.counts.easy;
        if (pool >= 10) setQuestionCount(10);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message === NO_QUIZ_ERROR) {
          setNoQuiz(true);
        } else {
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    }

    void loadSetup();
    return () => {
      cancelled = true;
    };
  }, [experimentId]);

  async function handleStart() {
    if (!availability || starting) return;
    const available = availability.counts[difficulty] ?? 0;
    if (available < questionCount) {
      setSetupError(
        `${questionCount} ${QUIZ_DIFFICULTY_LABELS[difficulty]} questions are not currently available. Available: ${available}. Please choose a smaller quiz or another difficulty.`,
      );
      return;
    }

    setStarting(true);
    setSetupError(null);
    try {
      const quizData = await startQuiz(experimentId, questionCount, difficulty);
      setQuiz(quizData);
      setAnswers({});
      setMarked(new Set());
      setCurrent(0);
      setPhase("running");
    } catch (error) {
      setSetupError(
        error instanceof Error
          ? error.message
          : "Could not start this quiz. Try another combination.",
      );
    } finally {
      setStarting(false);
    }
  }

  const total = quiz?.questions.length ?? 0;
  const question = quiz?.questions[current];

  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.filter((q) => answers[q.id]).length;
  }, [quiz, answers]);

  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  function selectAnswer(questionId: number, answer: AnswerLetter) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function toggleMark(questionId: number) {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  function goTo(index: number) {
    setCurrent(index);
  }

  function requestSubmit() {
    setSubmitError(null);
    setShowSubmitDialog(true);
  }

  async function confirmSubmit() {
    if (!quiz || submitting) return;
    setShowSubmitDialog(false);
    setSubmitting(true);

    try {
      const result = await submitQuiz(experimentId, quiz, answers);
      saveQuizResult(experimentId, result);
      navigate(`/quiz/${experimentId}/result`, { state: { result } });
    } catch {
      setSubmitting(false);
      setSubmitError("We couldn't submit your answers. Check your connection and try again.");
    }
  }

  if (setupLoading) {
    return (
      <div className="page quiz-page">
        <QuizSkeleton />
      </div>
    );
  }

  if (noQuiz) {
    return (
      <div className="page quiz-page">
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="No quiz available"
          description="This experiment does not have an assessment yet."
          action={
            <Button variant="secondary" to={`/experiments/${experimentId}`}>
              Back to Experiment
            </Button>
          }
        />
      </div>
    );
  }

  if (loadFailed && phase === "setup") {
    return (
      <div className="page quiz-page">
        <ErrorState
          title="Unable to load quiz setup."
          description="Something went wrong while retrieving availability."
          retryAction={() => window.location.reload()}
          retryLabel="Try Again"
        />
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <div className="page quiz-page">
        <nav className="quiz-breadcrumb" aria-label="Breadcrumb">
          <Link to="/quiz">Assessments</Link>
          <span className="quiz-bc-sep" aria-hidden="true">/</span>
          <span className="quiz-bc-current">{experiment?.title ?? experimentId}</span>
        </nav>
        <QuizSetup
          experimentTitle={experiment?.title ?? experimentId}
          availability={availability}
          questionCount={questionCount}
          difficulty={difficulty}
          starting={starting}
          error={setupError}
          onQuestionCount={setQuestionCount}
          onDifficulty={(level) => {
            setDifficulty(level);
            setSetupError(null);
          }}
          onStart={() => void handleStart()}
          onBackHref="/quiz"
        />
      </div>
    );
  }

  if (!quiz || !question) {
    return (
      <div className="page quiz-page">
        <ErrorState
          title="Unable to load this quiz."
          description="Something went wrong while starting the assessment."
          retryAction={() => setPhase("setup")}
          retryLabel="Back to Setup"
        />
      </div>
    );
  }

  const unanswered = total - answeredCount;

  return (
    <div className="page quiz-page">
      <nav className="quiz-breadcrumb" aria-label="Breadcrumb">
        <Link to="/quiz">Assessments</Link>
        <span className="quiz-bc-sep" aria-hidden="true">/</span>
        <Link to={`/experiments/${experimentId}`}>
          {experiment?.title ?? experimentId}
        </Link>
        <span className="quiz-bc-sep" aria-hidden="true">/</span>
        <span className="quiz-bc-current">Knowledge Check</span>
      </nav>

      <header className="quiz-header">
        <div className="quiz-header-main">
          <h1 className="quiz-title">
            {experiment?.title ?? experimentId} — Knowledge Check
          </h1>
          <p className="quiz-subtitle">{quiz.description}</p>
        </div>
        <div className="quiz-header-meta">
          {quiz.difficulty && (
            <Badge
              variant={
                quiz.difficulty === "easy"
                  ? "success"
                  : quiz.difficulty === "medium"
                    ? "warning"
                    : "danger"
              }
              size="sm"
            >
              {QUIZ_DIFFICULTY_LABELS[quiz.difficulty]}
            </Badge>
          )}
          <span className="quiz-meta-chip">
            <Clock size={13} /> ~{quiz.estimated_minutes} min
          </span>
          <span className="quiz-meta-chip">
            <ListChecks size={13} /> {total} questions
          </span>
        </div>
      </header>

      <div
        className="quiz-progress"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Answered questions"
      >
        <div className="quiz-progress-labels">
          <span>
            Question {current + 1} of {total}
          </span>
          <span>
            {answeredCount} of {total} answered
          </span>
        </div>
        <div className="quiz-progress-track">
          <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="quiz-stepper" aria-label="Question navigator">
        {quiz.questions.map((q, index) => {
          const isCurrent = index === current;
          const isAnswered = Boolean(answers[q.id]);
          const isMarked = marked.has(q.id);
          return (
            <button
              key={q.id}
              type="button"
              className={[
                "quiz-step",
                isCurrent ? "quiz-step--current" : "",
                isAnswered ? "quiz-step--answered" : "",
                isMarked ? "quiz-step--marked" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Question ${index + 1}${isAnswered ? " — answered" : " — not answered"}${isMarked ? " — marked for review" : ""}`}
              onClick={() => goTo(index)}
            >
              {index + 1}
              {isMarked && <span className="quiz-step-mark" aria-hidden="true">●</span>}
            </button>
          );
        })}
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        number={current + 1}
        total={total}
        selectedAnswer={answers[question.id] ?? null}
        disabled={submitting}
        onSelect={(letter) => selectAnswer(question.id, letter)}
      />

      {submitError && (
        <div className="quiz-submit-error" role="alert">
          <span>{submitError}</span>
          <Button variant="secondary" size="sm" onClick={requestSubmit}>
            Try Again
          </Button>
        </div>
      )}

      {submitting ? (
        <div className="quiz-submitting" role="status" aria-live="polite">
          <Spinner size="sm" />
          <span>Submitting your answers...</span>
        </div>
      ) : (
        <div className="quiz-nav-row">
          <button
            type="button"
            className={`quiz-mark-btn${marked.has(question.id) ? " quiz-mark-btn--active" : ""}`}
            onClick={() => toggleMark(question.id)}
            aria-pressed={marked.has(question.id)}
            title={marked.has(question.id) ? "Unmark" : "Mark for review"}
          >
            <Bookmark size={14} />
            {marked.has(question.id) ? "Marked" : "Mark for review"}
          </button>
          <QuizNavigation
            current={current}
            total={total}
            answeredCount={answeredCount}
            submitting={submitting}
            onPrevious={() => goTo(Math.max(0, current - 1))}
            onNext={() => goTo(Math.min(total - 1, current + 1))}
            onSubmit={requestSubmit}
          />
        </div>
      )}

      <Dialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onConfirm={confirmSubmit}
        title="Submit quiz?"
        description={
          unanswered > 0
            ? `You have answered ${answeredCount} of ${total} questions.${marked.size > 0 ? ` ${marked.size} question(s) marked for review.` : ""} Unanswered questions will be marked as incorrect.`
            : `You have answered all ${total} questions.${marked.size > 0 ? ` ${marked.size} marked for review.` : ""} Your answers will be graded immediately.`
        }
        confirmLabel="Submit Quiz"
        cancelLabel="Continue Quiz"
      />
    </div>
  );
}

function QuizPage() {
  const { experimentId } = useParams<{ experimentId: string }>();

  if (!experimentId) {
    return <QuizIndex />;
  }

  return <QuizRunner key={experimentId} experimentId={experimentId} />;
}

export default QuizPage;
