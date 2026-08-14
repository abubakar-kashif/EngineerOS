import os
from pathlib import Path

TEST_DB = Path(__file__).resolve().parent / "test_quiz.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"

from fastapi.testclient import TestClient

from app.db.database import Base, SessionLocal, engine
from app.db.seed import seed_quizzes
from app.main import app
from app.models.quiz import QuizQuestion


Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
seed_quizzes()

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "EngineerOS API"}


def test_get_quiz_success():
    response = client.get("/api/quizzes/ohms-law")
    assert response.status_code == 200
    data = response.json()
    assert data["experiment_id"] == "ohms-law"
    assert len(data["questions"]) == 10
    assert "correct_answer" not in data["questions"][0]
    assert "explanation" not in data["questions"][0]


def test_quiz_not_found():
    response = client.get("/api/quizzes/not-existing")
    assert response.status_code == 404


def test_successful_submission():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [{"question_id": q["id"], "answer": "A"} for q in questions]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.status_code == 200
    assert set(response.json()) == {
        "score",
        "total_questions",
        "correct_answers",
        "passed",
    }


def test_correct_score():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    correct = ["A", "B", "C", "B", "C", "A", "B", "C", "A", "A"]
    answers = [{"question_id": q["id"], "answer": a} for q, a in zip(questions, correct)]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.json()["score"] == 100.0
    assert response.json()["correct_answers"] == 10
    assert response.json()["total_questions"] == 10
    assert response.json()["passed"] is True


def test_incorrect_score():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [{"question_id": q["id"], "answer": "D"} for q in questions]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.json()["score"] == 0.0
    assert response.json()["passed"] is False


def test_answer_choice_is_normalized():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    correct = ["A", "B", "C", "B", "C", "A", "B", "C", "A", "A"]
    answers = [
        {"question_id": q["id"], "answer": a.lower()}
        for q, a in zip(questions, correct)
    ]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.status_code == 200
    assert response.json()["score"] == 100.0


def test_invalid_answer_rejected():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [{"question_id": q["id"], "answer": "Z"} for q in questions]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.status_code == 422


def test_empty_submission_rejected():
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": []})
    assert response.status_code == 422


def test_invalid_question_id_rejected():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [{"question_id": q["id"], "answer": "A"} for q in questions]
    answers[-1]["question_id"] = 999999
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.status_code == 400


def test_duplicate_question_ids_rejected():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [{"question_id": q["id"], "answer": "A"} for q in questions]
    answers[1]["question_id"] = answers[0]["question_id"]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.status_code == 400


def test_partial_submission_rejected():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": [{"question_id": questions[0]["id"], "answer": "A"}]},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "All quiz questions must be answered"


def test_passing_threshold():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    correct = ["A", "B", "C", "B", "C", "A", "B", "C", "A", "A"]
    answers = [{"question_id": q["id"], "answer": a} for q, a in zip(questions, correct)]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.json()["score"] >= 70
    assert response.json()["passed"] is True


def test_quiz_bank_has_100_questions():
    from app.data.quiz_bank import QUIZ_BANK

    assert len(QUIZ_BANK) == 10
    assert all(len(questions) == 10 for questions in QUIZ_BANK.values())
    assert sum(len(questions) for questions in QUIZ_BANK.values()) == 100


def test_seed_is_idempotent_and_repairs_partial_seed():
    with SessionLocal() as db:
        db.query(QuizQuestion).delete()
        db.commit()

        first = list(__import__("app.data.quiz_bank", fromlist=["iter_questions"]).iter_questions())
        db.add(QuizQuestion(**first[0]))
        db.commit()

    seed_quizzes()
    seed_quizzes()

    with SessionLocal() as db:
        assert db.query(QuizQuestion).count() == 100

