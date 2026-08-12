from pydantic import BaseModel,Field,field_validator

class QuizQuestionResponse(BaseModel):
    id:int
    question:str
    options:list[str]

class QuizResponse(BaseModel):
    experiment_id:str
    questions:list[QuizQuestionResponse]

class QuizAnswer(BaseModel):
    question_id:int
    answer:str=Field(min_length=1,max_length=1)
    @field_validator("answer")
    @classmethod
    def valid_answer(cls,v):
        v=v.strip().upper()
        if v not in {"A","B","C","D"}: raise ValueError("Answer must be A, B, C, or D")
        return v

class QuizSubmitRequest(BaseModel):
    answers:list[QuizAnswer]

class QuizSubmitResponse(BaseModel):
    score:int
    total_questions:int
    correct_answers:int
    passed:bool
