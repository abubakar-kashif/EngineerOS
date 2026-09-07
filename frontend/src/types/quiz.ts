export type AnswerLetter = "A" | "B" | "C" | "D";

/** Phase 6 question categories. */
export type QuizCategory =
  | "conceptual"
  | "formulas"
  | "numerical"
  | "circuit_behaviour"
  | "practical"
  | "troubleshooting"
  | "application"
  | "common_mistakes";

export interface QuizOption {
  key: AnswerLetter;
  text: string;
}

export interface QuizQuestion {
  id: number;
  experiment_id: string;
  question: string;
  options: QuizOption[];
  category?: QuizCategory;
}

export type QuizSource = "api" | "seed";

/** Learner-facing attempt difficulty (not experiment catalog Beginner/Intermediate/Advanced). */
export type QuizAttemptDifficulty = "easy" | "medium" | "hard";

export type QuizQuestionCount = 10 | 20 | 40;

export const QUIZ_DIFFICULTY_LABELS: Record<QuizAttemptDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const QUIZ_DIFFICULTY_DESCRIPTIONS: Record<QuizAttemptDifficulty, string> = {
  easy: "Fundamental concepts and straightforward calculations.",
  medium: "Conceptual understanding plus moderate calculations.",
  hard: "More challenging engineering reasoning and multi-step problems.",
};

export interface Quiz {
  experiment_id: string;
  title: string;
  description: string;
  estimated_minutes: number;
  questions: QuizQuestion[];
  source: QuizSource;
  /** Questions presented in this attempt (a random bank sample). */
  attempt_size?: number;
  /** Total questions available in the experiment's bank. */
  bank_size?: number;
  difficulty?: QuizAttemptDifficulty;
}

/** Map of question id -> selected answer letter. */
export type QuizAnswers = Record<number, AnswerLetter>;

export type QuizStatus = "excellent" | "passed" | "needs_review" | "incomplete";

export interface QuestionFeedback {
  question_id: number;
  question_number: number;
  question: string;
  options: QuizOption[];
  your_answer: AnswerLetter | null;
  correct_answer: AnswerLetter | null;
  is_correct: boolean;
  explanation: string;
}

export interface QuizResult {
  experiment_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  unanswered: number;
  passed: boolean;
  status: QuizStatus;
  submitted_at: string;
  /** Which grading path produced the aggregate score. */
  graded_by: "api" | "local";
  feedback: QuestionFeedback[];
}

export const QUIZ_STATUS_LABELS: Record<QuizStatus, string> = {
  excellent: "Excellent",
  passed: "Passed",
  needs_review: "Needs Review",
  incomplete: "Incomplete",
};

export const QUIZ_STATUS_MESSAGES: Record<QuizStatus, string> = {
  excellent: "Excellent understanding of the basics.",
  passed: "Good work — you passed this knowledge check.",
  needs_review: "You're close. Review the explanations below and retake the quiz.",
  incomplete: "This attempt is incomplete. Review the material and try again.",
};
