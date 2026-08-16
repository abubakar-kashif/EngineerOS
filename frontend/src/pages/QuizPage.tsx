import { useState } from "react";
import { useParams } from "react-router-dom";

type Question = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
  {
    question: "What is Ohm's Law?",
    options: [
      "V = I × R",
      "V = I + R",
      "V = R / I",
      "V = I / R",
    ],
    answer: "V = I × R",
    explanation:
      "Ohm's Law states that voltage is equal to current multiplied by resistance.",
  },
  {
    question: "What is the SI unit of electrical resistance?",
    options: ["Volt", "Ampere", "Ohm", "Watt"],
    answer: "Ohm",
    explanation:
      "The SI unit of electrical resistance is the Ohm (Ω).",
  },
  {
    question: "If V = 12 V and R = 6 Ω, what is the current?",
    options: ["1 A", "2 A", "6 A", "72 A"],
    answer: "2 A",
    explanation:
      "Using I = V / R, I = 12 / 6 = 2 A.",
  },
  {
    question: "What is the SI unit of current?",
    options: ["Volt", "Ohm", "Ampere", "Watt"],
    answer: "Ampere",
    explanation:
      "Electrical current is measured in Amperes (A).",
  },
  {
    question: "In a series circuit, what remains the same through all components?",
    options: ["Voltage", "Current", "Resistance", "Power"],
    answer: "Current",
    explanation:
      "In a series circuit, the same current flows through every component.",
  },
];

function QuizPage() {
  const { experimentId } = useParams();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = questions[currentQuestion];

  const handleAnswer = (option: string) => {
    if (submitted) return;

    setSelectedAnswer(option);
    setSubmitted(true);

    if (option === question.answer) {
      setScore((previous) => previous + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
      setSelectedAnswer("");
      setSubmitted(false);
    } else {
      setFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setScore(0);
    setSubmitted(false);
    setFinished(false);
  };

  if (finished) {
    const percentage = Math.round(
      (score / questions.length) * 100
    );

    return (
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "50px 30px",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            background: "#0f121c",
            border: "1px solid #292d3b",
            borderRadius: "20px",
            padding: "45px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "50px", marginBottom: "15px" }}>
            🎉
          </div>

          <h1 style={{ marginBottom: "10px" }}>
            Quiz Completed
          </h1>

          <p
            style={{
              color: "#9ca3af",
              fontSize: "17px",
            }}
          >
            Great work! Here is your result.
          </p>

          <div
            style={{
              margin: "35px auto",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "#241447",
              border: "3px solid #8b5cf6",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                fontWeight: 800,
              }}
            >
              {percentage}%
            </div>

            <div
              style={{
                color: "#9ca3af",
                marginTop: "5px",
              }}
            >
              Score
            </div>
          </div>

          <h2>
            {score} / {questions.length} Correct
          </h2>

          <button
            onClick={restartQuiz}
            style={{
              marginTop: "25px",
              padding: "14px 30px",
              borderRadius: "10px",
              border: "none",
              background: "#7c3aed",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 30px",
        color: "#ffffff",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            color: "#8b5cf6",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "1px",
            marginBottom: "10px",
          }}
        >
          ENGINEEROS • QUIZ
        </div>

        <h1
          style={{
            fontSize: "40px",
            margin: "0 0 10px",
          }}
        >
          Engineering Knowledge Quiz
        </h1>

        <p
          style={{
            color: "#9ca3af",
            margin: 0,
          }}
        >
          Test your understanding of electrical engineering concepts.
        </p>

        {experimentId && (
          <div
            style={{
              color: "#8b5cf6",
              marginTop: "10px",
              fontSize: "14px",
            }}
          >
            Experiment ID: {experimentId}
          </div>
        )}
      </div>

      {/* Progress */}
      <div
        style={{
          background: "#111522",
          border: "1px solid #292d3b",
          borderRadius: "14px",
          padding: "18px",
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          <span>
            Question {currentQuestion + 1} of {questions.length}
          </span>

          <span>
            Score: {score}
          </span>
        </div>

        <div
          style={{
            height: "8px",
            background: "#292d3b",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${
                ((currentQuestion + 1) / questions.length) * 100
              }%`,
              background: "#8b5cf6",
              borderRadius: "20px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          background: "#0f121c",
          border: "1px solid #292d3b",
          borderRadius: "18px",
          padding: "30px",
        }}
      >
        <div
          style={{
            color: "#8b5cf6",
            fontSize: "14px",
            fontWeight: 700,
            marginBottom: "12px",
          }}
        >
          QUESTION {currentQuestion + 1}
        </div>

        <h2
          style={{
            fontSize: "25px",
            lineHeight: 1.4,
            marginTop: 0,
            marginBottom: "25px",
          }}
        >
          {question.question}
        </h2>

        {/* Options */}
        <div
          style={{
            display: "grid",
            gap: "13px",
          }}
        >
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = submitted && option === question.answer;
            const isWrong =
              submitted &&
              isSelected &&
              option !== question.answer;

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                style={{
                  width: "100%",
                  padding: "17px 18px",
                  textAlign: "left",
                  borderRadius: "12px",
                  border: isCorrect
                    ? "1px solid #22c55e"
                    : isWrong
                    ? "1px solid #ef4444"
                    : isSelected
                    ? "1px solid #8b5cf6"
                    : "1px solid #292d3b",
                  background: isCorrect
                    ? "#10291b"
                    : isWrong
                    ? "#2a1418"
                    : isSelected
                    ? "#241447"
                    : "#111522",
                  color: "#ffffff",
                  cursor: submitted
                    ? "default"
                    : "pointer",
                  fontSize: "16px",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                    background: "#292d3b",
                    color: "#d1d5db",
                    fontWeight: 700,
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </span>

                {option}

                {isCorrect && (
                  <span style={{ float: "right" }}>
                    ✓
                  </span>
                )}

                {isWrong && (
                  <span style={{ float: "right" }}>
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {submitted && (
          <div
            style={{
              marginTop: "22px",
              padding: "18px",
              borderRadius: "12px",
              background: "#111522",
              border: "1px solid #292d3b",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: "7px",
              }}
            >
              {selectedAnswer === question.answer
                ? "✅ Correct!"
                : "❌ Incorrect"}
            </div>

            <div
              style={{
                color: "#9ca3af",
                lineHeight: 1.6,
              }}
            >
              {question.explanation}
            </div>
          </div>
        )}

        {/* Next */}
        {submitted && (
          <button
            onClick={nextQuestion}
            style={{
              marginTop: "22px",
              padding: "14px 28px",
              borderRadius: "10px",
              border: "none",
              background: "#7c3aed",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {currentQuestion === questions.length - 1
              ? "Finish Quiz"
              : "Next Question →"}
          </button>
        )}
      </div>
    </div>
  );
}

export default QuizPage;