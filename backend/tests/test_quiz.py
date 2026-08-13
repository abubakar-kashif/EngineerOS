import os

os.environ["DATABASE_URL"] = "sqlite:///./test_quiz.db"

from fastapi.testclient import TestClient

from app.db.database import Base, engine, SessionLocal
from app.db.seed import seed_quizzes
from app.main import app


Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
seed_quizzes()

client = TestClient(app)


def test_get_quiz_success():
    response = client.get("/api/quizzes/ohms-law")
    assert response.status_code == 200
    data = response.json()
    assert data["experiment_id"] == "ohms-law"
    assert len(data["questions"]) == 10
    assert "correct_answer" not in data["questions"][0]


def test_quiz_not_found():
    response = client.get("/api/quizzes/not-existing")
    assert response.status_code == 404


def test_successful_submission():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [{"question_id": q["id"], "answer": "A"} for q in questions]

    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": answers},
    )

    assert response.status_code == 200
    assert "score" in response.json()


def test_correct_score():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    correct = ["A", "B", "C", "B", "C", "A", "B", "C", "A", "A"]
    answers = [
        {"question_id": q["id"], "answer": answer}
        for q, answer in zip(questions, correct)
    ]

    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": answers},
    )

    assert response.json()["score"] == 100.0
    assert response.json()["passed"] is True


def test_incorrect_score():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [{"question_id": q["id"], "answer": "D"} for q in questions]

    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": answers},
    )

    assert response.json()["score"] == 0.0
    assert response.json()["passed"] is False


def test_invalid_answer_rejected():
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": [{"question_id": 1, "answer": "Z"}]},
    )
    assert response.status_code == 422


def test_empty_submission_rejected():
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": []},
    )
    assert response.status_code in (400, 422)


def test_invalid_question_id_rejected():
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": [{"question_id": 999999, "answer": "A"}]},
    )
    assert response.status_code == 400


def test_duplicate_question_ids_rejected():
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={
            "answers": [
                {"question_id": 1, "answer": "A"},
                {"question_id": 1, "answer": "B"},
            ]
        },
    )
    assert response.status_code == 400


def test_passing_threshold():
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]

    correct = ["A", "B", "C", "B", "C", "A", "B", "C", "A", "A"]
    answers = [
        {"question_id": q["id"], "answer": answer}
        for q, answer in zip(questions, correct)
    ]

    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": answers},
    )

    assert response.json()["score"] >= 70
    assert response.json()["passed"] is True
