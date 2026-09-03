import AnswerOption from "./AnswerOption";
import type { AnswerLetter, QuizQuestion } from "../../types/quiz";

type QuestionCardProps = {
  question: QuizQuestion;
  number: number;
  total: number;
  selectedAnswer: AnswerLetter | null;
  disabled?: boolean;
  /** Review mode: shows correct/incorrect markings and locks interaction. */
  showFeedback?: boolean;
  correctAnswer?: AnswerLetter | null;
  isCorrect?: boolean;
  onSelect?: (key: AnswerLetter) => void;
};

function QuestionCard({
  question,
  number,
  total,
  selectedAnswer,
  disabled = false,
  showFeedback = false,
  correctAnswer = null,
  isCorrect = false,
  onSelect,
}: QuestionCardProps) {
  const headingId = `quiz-question-${question.id}`;

  return (
    <article className="quiz-question-card" aria-labelledby={headingId}>
      <div className="quiz-question-meta">
        <span className="quiz-question-number">
          Question {number}
          <span className="quiz-question-total"> of {total}</span>
        </span>
        {showFeedback && (
          <span
            className={
              isCorrect
                ? "quiz-feedback-flag quiz-feedback-flag--correct"
                : "quiz-feedback-flag quiz-feedback-flag--incorrect"
            }
          >
            {isCorrect ? "Correct" : selectedAnswer === null ? "Not answered" : "Incorrect"}
          </span>
        )}
      </div>

      <h2 className="quiz-question-text" id={headingId}>
        {question.question}
      </h2>

      <div className="quiz-options" role="radiogroup" aria-labelledby={headingId}>
        {question.options.map((option) => {
          let state: "default" | "correct" | "incorrect" = "default";
          if (showFeedback) {
            if (correctAnswer !== null && option.key === correctAnswer) {
              state = "correct";
            } else if (selectedAnswer === option.key) {
              state = "incorrect";
            }
          }

          return (
            <AnswerOption
              key={option.key}
              name={`question-${question.id}`}
              optionKey={option.key}
              text={option.text}
              selected={selectedAnswer === option.key}
              disabled={disabled || showFeedback}
              state={state}
              onSelect={onSelect ?? (() => undefined)}
            />
          );
        })}
      </div>
    </article>
  );
}

export default QuestionCard;
