import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import {
  getQuiz,
  submitQuiz,
  type Quiz,
  type QuizSubmitResponse,
} from "../services/quizService";

function QuizPage() {
  const { experimentId } = useParams<{ experimentId: string }>();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D">>(
    {},
  );
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      if (!experimentId) {
        setError("Experiment ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getQuiz(experimentId);
        setQuiz(data);
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError("Unable to load this quiz.");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [experimentId]);

  function selectAnswer(
    questionId: number,
    answer: "A" | "B" | "C" | "D",
  ) {
    setAnswers((current) => ({
      ...current,
      [questionId]: answer,
    }));
  }

  async function handleSubmit() {
    if (!quiz || !experimentId) return;

    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("Please answer every question before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await submitQuiz(experimentId, {
        answers: quiz.questions.map((question) => ({
          question_id: question.id,
          answer: answers[question.id],
        })),
      });

      setResult(response);
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      setError("Unable to submit the quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <LoadingState message="Loading quiz..." />
      </main>
    );
  }

  if (error && !quiz) {
    return (
      <main className="page-container">
        <ErrorState message={error} />
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="page-container">
        <ErrorState message="Quiz not found." />
      </main>
    );
  }

  if (result) {
    return (
      <main className="page-container">
        <section className="page-state">
          <p className="eyebrow">QUIZ RESULT</p>

          <h1>
            {result.passed ? "Quiz Passed!" : "Quiz Completed"}
          </h1>

          <p>
            You answered {result.correct_answers} out of{" "}
            {result.total_questions} questions correctly.
          </p>

          <p>
            Score: <strong>{result.score}%</strong>
          </p>

          <div className="page-actions">
            <Link to={`/experiments/${experimentId}`}>
              <Button type="button" variant="secondary">
                Back to Experiment
              </Button>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-container">
      <section className="details-header">
        <div className="details-header-content">
          <p className="eyebrow">KNOWLEDGE CHECK</p>

          <h1>Experiment Quiz</h1>

          <p className="details-description">
            Test your understanding of the experiment before moving
            forward.
          </p>
        </div>
      </section>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} />
        </div>
      )}

      <section className="details-section">
        <div className="space-y-5">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              <div className="details-card-content">
                <p className="eyebrow">
                  QUESTION {index + 1}
                </p>

                <h2>{question.question}</h2>

                <div className="mt-5 space-y-3">
                  {(
                    [
                      ["A", question.option_a],
                      ["B", question.option_b],
                      ["C", question.option_c],
                      ["D", question.option_d],
                    ] as const
                  ).map(([letter, text]) => (
                    <label
                      key={letter}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-violet-300"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={letter}
                        checked={answers[question.id] === letter}
                        onChange={() =>
                          selectAnswer(question.id, letter)
                        }
                      />

                      <span>
                        <strong>{letter}.</strong> {text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="details-cta">
        <Card>
          <div className="details-cta-content">
            <div>
              <p className="eyebrow">SUBMIT</p>
              <h2>Complete the quiz</h2>
              <p>
                Answer all questions and submit your answers to see
                your result.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

export default QuizPage;