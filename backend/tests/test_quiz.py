import os
from pathlib import Path

TEST_DB = Path(__file__).resolve().parent / "test_quiz.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"

from fastapi.testclient import TestClient

from app.db.database import Base, SessionLocal, engine
from app.db.seed import seed_quizzes
from app.main import app
from app.models.quiz import QuizQuestion
from app.services.quiz_service import QUIZ_ATTEMPT_SIZE


Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
seed_quizzes()

client = TestClient(app)

ANSWER_LETTERS = ("A", "B", "C", "D")
EXPECTED_BANK_SIZE = 55
EXPECTED_TOTAL = EXPECTED_BANK_SIZE * 10


def seeded_answer_key(experiment_id="ohms-law"):
    """The answer key as stored in the seeded database."""
    with SessionLocal() as db:
        rows = (
            db.query(QuizQuestion)
            .filter(QuizQuestion.experiment_id == experiment_id)
            .order_by(QuizQuestion.id)
            .all()
        )
    return {row.id: row.correct_answer for row in rows}


def wrong_letter(correct):
    """Any letter except the correct one."""
    return ANSWER_LETTERS[(ANSWER_LETTERS.index(correct) + 1) % 4]


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "EngineerOS API"}


def test_get_quiz_success():
    response = client.get("/api/quizzes/ohms-law")
    assert response.status_code == 200
    data = response.json()
    assert data["experiment_id"] == "ohms-law"
    assert len(data["questions"]) == EXPECTED_BANK_SIZE
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
    key = seeded_answer_key()
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [{"question_id": q["id"], "answer": key[q["id"]]} for q in questions]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.json()["score"] == 100.0
    assert response.json()["correct_answers"] == EXPECTED_BANK_SIZE
    assert response.json()["total_questions"] == EXPECTED_BANK_SIZE
    assert response.json()["passed"] is True


def test_incorrect_score():
    key = seeded_answer_key()
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [
        {"question_id": q["id"], "answer": wrong_letter(key[q["id"]])}
        for q in questions
    ]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.json()["score"] == 0.0
    assert response.json()["passed"] is False


def test_answer_choice_is_normalized():
    key = seeded_answer_key()
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    answers = [
        {"question_id": q["id"], "answer": key[q["id"]].lower()} for q in questions
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
    assert (
        f"at least {QUIZ_ATTEMPT_SIZE} of {EXPECTED_BANK_SIZE} questions"
        in response.json()["detail"]
    )


def test_attempt_size_submission_grades_over_attempt():
    """Phase 2: a 40-question attempt is graded over its own size."""
    key = seeded_answer_key()
    questions = client.get("/api/quizzes/ohms-law").json()["questions"][:QUIZ_ATTEMPT_SIZE]
    answers = [{"question_id": q["id"], "answer": key[q["id"]]} for q in questions]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.status_code == 200
    assert response.json()["total_questions"] == QUIZ_ATTEMPT_SIZE
    assert response.json()["correct_answers"] == QUIZ_ATTEMPT_SIZE
    assert response.json()["score"] == 100.0
    assert response.json()["passed"] is True


def test_passing_threshold():
    key = seeded_answer_key()
    questions = client.get("/api/quizzes/ohms-law").json()["questions"]
    # 28 of 40 attempted questions correct — exactly the 70% threshold.
    answers = [
        {
            "question_id": q["id"],
            "answer": key[q["id"]] if index < 28 else wrong_letter(key[q["id"]]),
        }
        for index, q in enumerate(questions[:QUIZ_ATTEMPT_SIZE])
    ]
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": answers})
    assert response.json()["score"] == 70.0
    assert response.json()["passed"] is True


def test_quiz_bank_has_at_least_40_questions_per_experiment():
    from app.data.quiz_bank import QUIZ_BANK

    assert len(QUIZ_BANK) == 10
    assert all(len(questions) >= 40 for questions in QUIZ_BANK.values())
    assert all(len(questions) == EXPECTED_BANK_SIZE for questions in QUIZ_BANK.values())
    assert sum(len(questions) for questions in QUIZ_BANK.values()) == EXPECTED_TOTAL

    for experiment_id, questions in QUIZ_BANK.items():
        seen = set()
        for question in questions:
            assert question["question"].strip()
            options = [
                question["option_a"],
                question["option_b"],
                question["option_c"],
                question["option_d"],
            ]
            assert len(options) == 4
            assert len(set(options)) == 4
            assert question["correct_answer"] in ANSWER_LETTERS
            assert question["explanation"].strip()
            assert question["question"] not in seen
            seen.add(question["question"])

    # The original ten ohms-law answers keep their order, so question IDs
    # stay stable against the frontend mirror for the base bank.
    assert [q["correct_answer"] for q in QUIZ_BANK["ohms-law"][:10]] == [
        "A", "B", "C", "B", "C", "A", "B", "C", "A", "A",
    ]


def test_attempt_size_constant():
    assert QUIZ_ATTEMPT_SIZE == 40


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
        assert db.query(QuizQuestion).count() == EXPECTED_TOTAL


def test_seed_refreshes_stale_rows():
    """Databases seeded from an older bank get their rows reconciled."""
    from app.data.quiz_bank import QUIZ_BANK

    with SessionLocal() as db:
        row = db.query(QuizQuestion).filter(QuizQuestion.id == 1).first()
        row.question = "STALE question text"
        row.correct_answer = "D"
        db.commit()

    seed_quizzes()

    with SessionLocal() as db:
        row = db.query(QuizQuestion).filter(QuizQuestion.id == 1).first()
        assert row.question == QUIZ_BANK["ohms-law"][0]["question"]
        assert row.correct_answer == QUIZ_BANK["ohms-law"][0]["correct_answer"]
