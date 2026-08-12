from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.quiz import QuizResponse,QuizSubmitRequest,QuizSubmitResponse
from app.services.quiz_service import get_quiz_questions,submit_quiz

router=APIRouter(prefix="/api/quizzes",tags=["Quiz"])

@router.get("/{experiment_id}",response_model=QuizResponse)
def get_quiz(experiment_id:str,db:Session=Depends(get_db)):
    qs=get_quiz_questions(db,experiment_id)
    if not qs: raise HTTPException(status_code=404,detail=f"No quiz found for experiment '{experiment_id}'")
    return {"experiment_id":experiment_id,"questions":[{"id":q.id,"question":q.question,"options":[q.option_a,q.option_b,q.option_c,q.option_d]} for q in qs]}

@router.post("/{experiment_id}/submit",response_model=QuizSubmitResponse)
def submit_quiz_answers(experiment_id:str,payload:QuizSubmitRequest,db:Session=Depends(get_db)):
    result=submit_quiz(db,experiment_id,payload.answers)
    if result is None: raise HTTPException(status_code=404,detail=f"No quiz found for experiment '{experiment_id}'")
    return result
