import Button from "../ui/Button";
import {
  QUIZ_DIFFICULTY_DESCRIPTIONS,
  QUIZ_DIFFICULTY_LABELS,
  type QuizAttemptDifficulty,
  type QuizQuestionCount,
} from "../../types/quiz";
import { QUIZ_QUESTION_COUNTS } from "../../data/quiz/quizBank";

type QuizSetupProps = {
  topic: string;
  difficulty: QuizAttemptDifficulty;
  questionCount: QuizQuestionCount;
  poolSize: number;
  preferredCount: number;
  supportedCounts: QuizQuestionCount[];
  onDifficultyChange: (difficulty: QuizAttemptDifficulty) => void;
  onQuestionCountChange: (count: QuizQuestionCount) => void;
  onStart: () => void;
  starting?: boolean;
};

const DIFFICULTIES: QuizAttemptDifficulty[] = ["easy", "medium", "hard"];

function QuizSetup({
  topic,
  difficulty,
  questionCount,
  poolSize,
  preferredCount,
  supportedCounts,
  onDifficultyChange,
  onQuestionCountChange,
  onStart,
  starting = false,
}: QuizSetupProps) {
  const countSupported = supportedCounts.includes(questionCount);
  const canStart = poolSize > 0 && countSupported && !starting;

  return (
    <div className="quiz-setup">
      <section className="quiz-setup-section" aria-labelledby="quiz-setup-difficulty">
        <h2 className="quiz-setup-heading" id="quiz-setup-difficulty">
          What difficulty do you want?
        </h2>
        <div className="quiz-setup-grid" role="radiogroup" aria-labelledby="quiz-setup-difficulty">
          {DIFFICULTIES.map((level) => {
            const selected = difficulty === level;
            return (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`quiz-setup-choice${selected ? " quiz-setup-choice--selected" : ""}`}
                onClick={() => onDifficultyChange(level)}
              >
                <span className="quiz-setup-choice-title">{QUIZ_DIFFICULTY_LABELS[level]}</span>
                <span className="quiz-setup-choice-copy">{QUIZ_DIFFICULTY_DESCRIPTIONS[level]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="quiz-setup-section" aria-labelledby="quiz-setup-count">
        <h2 className="quiz-setup-heading" id="quiz-setup-count">
          How many questions?
        </h2>
        <div className="quiz-setup-quantities" role="radiogroup" aria-labelledby="quiz-setup-count">
          {QUIZ_QUESTION_COUNTS.map((count) => {
            const selected = questionCount === count;
            const enabled = supportedCounts.includes(count);
            return (
              <button
                key={count}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!enabled}
                className={`quiz-setup-choice quiz-setup-choice--compact${selected ? " quiz-setup-choice--selected" : ""}`}
                onClick={() => enabled && onQuestionCountChange(count)}
              >
                <span className="quiz-setup-choice-title">{count} Questions</span>
                <span className="quiz-setup-choice-copy">
                  {enabled
                    ? `This attempt will ask ${count} questions.`
                    : `Only ${poolSize} questions are available at this difficulty.`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="quiz-setup-summary" aria-labelledby="quiz-setup-summary">
        <h2 className="quiz-setup-heading" id="quiz-setup-summary">
          Quiz
        </h2>
        <dl className="quiz-setup-summary-list">
          <div>
            <dt>Difficulty</dt>
            <dd>{QUIZ_DIFFICULTY_LABELS[difficulty]}</dd>
          </div>
          <div>
            <dt>Questions</dt>
            <dd>{countSupported ? questionCount : poolSize}</dd>
          </div>
          <div>
            <dt>Topic</dt>
            <dd>{topic}</dd>
          </div>
        </dl>
        {preferredCount < questionCount && (
          <p className="quiz-setup-note">
            This topic has {preferredCount} {QUIZ_DIFFICULTY_LABELS[difficulty].toLowerCase()}{" "}
            questions. The remaining {questionCount - preferredCount} come from the same experiment,
            without repeats.
          </p>
        )}
        <Button variant="primary" onClick={onStart} disabled={!canStart} loading={starting}>
          Start Quiz
        </Button>
      </section>
    </div>
  );
}

export default QuizSetup;
