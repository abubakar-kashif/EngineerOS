/**
 * Quiz setup — choose question count + difficulty before starting an attempt.
 */
import { AlertTriangle, ListChecks, Signal } from "lucide-react";
import Button from "../ui/Button";
import { QUIZ_DIFFICULTY_LABELS } from "../../data/quiz/quizBank";
import {
  QUIZ_ALLOWED_COUNTS,
  QUIZ_DIFFICULTIES,
  type QuizDifficultyLevel,
  type QuizQuestionCount,
} from "../../data/quiz/quizDifficulty";
import type { QuizAvailability } from "../../services/quiz/quizService";

interface QuizSetupProps {
  experimentTitle: string;
  availability: QuizAvailability | null;
  questionCount: QuizQuestionCount;
  difficulty: QuizDifficultyLevel;
  starting: boolean;
  error: string | null;
  onQuestionCount: (count: QuizQuestionCount) => void;
  onDifficulty: (difficulty: QuizDifficultyLevel) => void;
  onStart: () => void;
  onBackHref: string;
}

function QuizSetup({
  experimentTitle,
  availability,
  questionCount,
  difficulty,
  starting,
  error,
  onQuestionCount,
  onDifficulty,
  onStart,
  onBackHref,
}: QuizSetupProps) {
  const available = availability?.counts[difficulty] ?? 0;
  const countOk = available >= questionCount;
  const canStart = Boolean(availability) && countOk && !starting;

  return (
    <div className="quiz-setup">
      <div className="quiz-setup-card">
        <p className="quiz-setup-eyebrow">Quiz setup</p>
        <h1 className="quiz-setup-title">{experimentTitle}</h1>
        <p className="quiz-setup-desc">
          Choose how many questions you want and the difficulty. Only questions tagged with that
          difficulty are included — never mixed, never duplicated.
        </p>

        <section className="quiz-setup-section" aria-labelledby="quiz-count-label">
          <h2 id="quiz-count-label" className="quiz-setup-label">
            <ListChecks size={14} /> Number of Questions
          </h2>
          <div className="quiz-setup-options" role="group" aria-label="Question count">
            {QUIZ_ALLOWED_COUNTS.map((count) => {
              const enabled = (availability?.counts[difficulty] ?? 0) >= count;
              return (
                <button
                  key={count}
                  type="button"
                  className={`quiz-setup-chip${questionCount === count ? " quiz-setup-chip--active" : ""}`}
                  disabled={!enabled}
                  aria-pressed={questionCount === count}
                  title={
                    enabled
                      ? `${count} questions`
                      : `${count} unavailable — only ${availability?.counts[difficulty] ?? 0} ${difficulty} questions`
                  }
                  onClick={() => onQuestionCount(count)}
                >
                  {count}
                  {!enabled && <span className="quiz-setup-chip-note">unavailable</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="quiz-setup-section" aria-labelledby="quiz-diff-label">
          <h2 id="quiz-diff-label" className="quiz-setup-label">
            <Signal size={14} /> Difficulty
          </h2>
          <div className="quiz-setup-options" role="group" aria-label="Difficulty">
            {QUIZ_DIFFICULTIES.map((level) => {
              const pool = availability?.counts[level] ?? 0;
              return (
                <button
                  key={level}
                  type="button"
                  className={`quiz-setup-chip${difficulty === level ? " quiz-setup-chip--active" : ""}`}
                  aria-pressed={difficulty === level}
                  onClick={() => onDifficulty(level)}
                >
                  {QUIZ_DIFFICULTY_LABELS[level]}
                  <span className="quiz-setup-chip-note">{pool} available</span>
                </button>
              );
            })}
          </div>
        </section>

        {!countOk && availability && (
          <div className="quiz-setup-warn" role="status">
            <AlertTriangle size={16} />
            <div>
              <strong>
                {questionCount} {QUIZ_DIFFICULTY_LABELS[difficulty]} questions are not currently
                available.
              </strong>
              <p>
                Available: {available}. Please choose a smaller quiz or another difficulty.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="quiz-setup-error" role="alert">
            {error}
          </div>
        )}

        <div className="quiz-setup-actions">
          <Button variant="secondary" to={onBackHref}>
            Back
          </Button>
          <Button variant="primary" disabled={!canStart} onClick={onStart}>
            {starting ? "Starting…" : "Start Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default QuizSetup;
