import { apiRequest } from "./api";

export type QuizAnswer = {
  question_id: number;
  answer: "A" | "B" | "C" | "D";
};

export interface QuizQuestion {
  id: number;
  experiment_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface Quiz {
  experiment_id: string;
  questions: QuizQuestion[];
}

export interface QuizSubmitRequest {
  answers: QuizAnswer[];
}

export interface QuizSubmitResponse {
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
}

export async function getQuiz(
  experimentId: string,
): Promise<Quiz> {
  return apiRequest<Quiz>(
    `/quizzes/${encodeURIComponent(experimentId)}`,
  );
}

export async function submitQuiz(
  experimentId: string,
  data: QuizSubmitRequest,
): Promise<QuizSubmitResponse> {
  return apiRequest<QuizSubmitResponse>(
    `/quizzes/${encodeURIComponent(experimentId)}/submit`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}