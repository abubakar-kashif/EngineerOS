import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { QuestionFeedback } from "../../types/quiz";

type ReviewFilter = "all" | "correct" | "incorrect";

type QuizReviewProps = {
  feedback: QuestionFeedback[];
};

function answerText(feedback: QuestionFeedback, letter: string | null): string {
  if (letter === null) return "Not answered";
  const option = feedback.options.find((o) => o.key === letter);
  return option ? `${letter}. ${option.text}` : `Option ${letter}`;
}

function QuizReview({ feedback }: QuizReviewProps) {
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const correctCount = feedback.filter((f) => f.is_correct).length;
  const incorrectCount = feedback.length - correctCount;

  const visible = feedback.filter((f) => {
    if (filter === "correct") return f.is_correct;
    if (filter === "incorrect") return !f.is_correct;
    return true;
  });

  const filters: { value: ReviewFilter; label: string }[] = [
    { value: "all", label: `All (${feedback.length})` },
    { value: "correct", label: `Correct (${correctCount})` },
    { value: "incorrect", label: `Incorrect (${incorrectCount})` },
  ];

  return (
    <div className="quiz-review">
      <div className="quiz-review-tabs" role="group" aria-label="Filter reviewed questions">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`quiz-review-tab${filter === f.value ? " quiz-review-tab--active" : ""}`}
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="quiz-review-empty">
          {filter === "correct"
            ? "No correct answers in this attempt."
            : "No incorrect answers in this attempt."}
        </p>
      ) : (
        <div className="quiz-review-list">
          {visible.map((item) => (
            <article key={item.question_id} className="quiz-review-item">
              <header className="quiz-review-item-head">
                <span className="quiz-review-item-number">Question {item.question_number}</span>
                <span
                  className={
                    item.is_correct
                      ? "quiz-review-flag quiz-review-flag--correct"
                      : "quiz-review-flag quiz-review-flag--incorrect"
                  }
                >
                  {item.is_correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {item.is_correct ? "Correct" : item.your_answer === null ? "Not answered" : "Incorrect"}
                </span>
              </header>

              <p className="quiz-review-question">{item.question}</p>

              <div className="quiz-review-answers">
                <div className="quiz-review-answer">
                  <span className="quiz-review-answer-label">Your answer</span>
                  <span
                    className={
                      item.is_correct
                        ? "quiz-review-answer-value"
                        : "quiz-review-answer-value quiz-review-answer-value--wrong"
                    }
                  >
                    {answerText(item, item.your_answer)}
                  </span>
                </div>
                {!item.is_correct && item.correct_answer !== null && (
                  <div className="quiz-review-answer quiz-review-answer--correct">
                    <span className="quiz-review-answer-label">Correct answer</span>
                    <span className="quiz-review-answer-value quiz-review-answer-value--right">
                      {answerText(item, item.correct_answer)}
                    </span>
                  </div>
                )}
              </div>

              <p className="quiz-review-why">
                <span className="quiz-review-why-label">Why:</span> {item.explanation}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuizReview;
