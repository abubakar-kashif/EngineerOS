from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


AnswerChoice = Literal["A", "B", "C", "D"]


class QuizQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    experiment_id: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str


class QuizResponse(BaseModel):
    experiment_id: str
    questions: list[QuizQuestionResponse]


class QuizAnswer(BaseModel):
    question_id: int = Field(gt=0)
    answer: AnswerChoice

    @field_validator("answer", mode="before")
    @classmethod
    def normalize_answer(cls, value):
        if isinstance(value, str):
            return value.strip().upper()
        return value


class QuizSubmitRequest(BaseModel):
    answers: list[QuizAnswer] = Field(min_length=1)


class QuizSubmitResponse(BaseModel):
    score: float
    total_questions: int
    correct_answers: int
    passed: bool
