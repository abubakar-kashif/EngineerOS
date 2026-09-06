import os
from pathlib import Path

TEST_DB = Path(__file__).resolve().parent / "test_quiz.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"

from fastapi.testclient import TestClient

from app.data.quiz_difficulty import ALLOWED_COUNTS, DIFFICULTIES, TARGET_PER_DIFFICULTY
from app.db.database import Base, SessionLocal, engine
from app.db.seed import seed_quizzes
from app.main import app
from app.models.quiz import QuizQuestion


Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
seed_quizzes()

client = TestClient(app)

ANSWER_LETTERS = ("A", "B", "C", "D")
ENRICHED_TOTAL = 10 * 3 * TARGET_PER_DIFFICULTY  # 1200


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
    assert len(data["questions"]) == 3 * TARGET_PER_DIFFICULTY
    assert "correct_answer" not in data["questions"][0]
    assert "explanation" not in data["questions"][0]
    assert data["questions"][0]["difficulty"] in DIFFICULTIES


def test_quiz_availability_counts():
    response = client.get("/api/quizzes/ohms-law/availability")
    assert response.status_code == 200
    data = response.json()
    assert data["counts"]["easy"] == TARGET_PER_DIFFICULTY
    assert data["counts"]["medium"] == TARGET_PER_DIFFICULTY
    assert data["counts"]["hard"] == TARGET_PER_DIFFICULTY
    assert data["allowed_counts"] == list(ALLOWED_COUNTS)


def test_start_quiz_count_and_difficulty():
    for count in ALLOWED_COUNTS:
        for difficulty in DIFFICULTIES:
            response = client.post(
                "/api/quizzes/ohms-law/start",
                json={"question_count": count, "difficulty": difficulty},
            )
            assert response.status_code == 200, response.text
            data = response.json()
            assert data["question_count"] == count
            assert data["difficulty"] == difficulty
            assert len(data["questions"]) == count
            assert len({q["id"] for q in data["questions"]}) == count
            assert all(q["difficulty"] == difficulty for q in data["questions"])


def test_start_quiz_insufficient_pool():
    """Force an insufficient pool by requesting more than available."""
    # Temporarily impossible request via unsupported combo is already blocked
    # by schema; simulate by shrinking hard pool in DB then restoring.
    with SessionLocal() as db:
        hard = (
            db.query(QuizQuestion)
            .filter(
                QuizQuestion.experiment_id == "ohms-law",
                QuizQuestion.difficulty == "hard",
            )
            .order_by(QuizQuestion.id)
            .all()
        )
        kept_ids = {row.id for row in hard[:7]}
        for row in hard:
            if row.id not in kept_ids:
                db.delete(row)
        db.commit()

    response = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 20, "difficulty": "hard"},
    )
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "not currently available" in detail
    assert "Available: 7" in detail

    # Restore bank for later tests
    seed_quizzes()


def test_quiz_not_found():
    response = client.get("/api/quizzes/not-existing")
    assert response.status_code == 404


def test_successful_submission():
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 10, "difficulty": "easy"},
    ).json()
    answers = [{"question_id": q["id"], "answer": "A"} for q in started["questions"]]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={
            "answers": answers,
            "difficulty": "easy",
            "question_count": 10,
        },
    )
    assert response.status_code == 200
    assert set(response.json()) == {
        "score",
        "total_questions",
        "correct_answers",
        "passed",
    }


def test_correct_score():
    key = seeded_answer_key()
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 20, "difficulty": "medium"},
    ).json()
    answers = [
        {"question_id": q["id"], "answer": key[q["id"]]}
        for q in started["questions"]
    ]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={
            "answers": answers,
            "difficulty": "medium",
            "question_count": 20,
        },
    )
    assert response.json()["score"] == 100.0
    assert response.json()["correct_answers"] == 20
    assert response.json()["total_questions"] == 20
    assert response.json()["passed"] is True


def test_incorrect_score():
    key = seeded_answer_key()
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 10, "difficulty": "hard"},
    ).json()
    answers = [
        {"question_id": q["id"], "answer": wrong_letter(key[q["id"]])}
        for q in started["questions"]
    ]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={
            "answers": answers,
            "difficulty": "hard",
            "question_count": 10,
        },
    )
    assert response.json()["score"] == 0.0
    assert response.json()["passed"] is False


def test_answer_choice_is_normalized():
    key = seeded_answer_key()
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 10, "difficulty": "easy"},
    ).json()
    answers = [
        {"question_id": q["id"], "answer": key[q["id"]].lower()}
        for q in started["questions"]
    ]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={
            "answers": answers,
            "difficulty": "easy",
            "question_count": 10,
        },
    )
    assert response.status_code == 200
    assert response.json()["score"] == 100.0


def test_invalid_answer_rejected():
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 10, "difficulty": "easy"},
    ).json()
    answers = [{"question_id": q["id"], "answer": "Z"} for q in started["questions"]]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": answers, "difficulty": "easy", "question_count": 10},
    )
    assert response.status_code == 422


def test_empty_submission_rejected():
    response = client.post("/api/quizzes/ohms-law/submit", json={"answers": []})
    assert response.status_code == 422


def test_invalid_question_id_rejected():
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 10, "difficulty": "easy"},
    ).json()
    answers = [{"question_id": q["id"], "answer": "A"} for q in started["questions"]]
    answers[-1]["question_id"] = 999999
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": answers, "difficulty": "easy", "question_count": 10},
    )
    assert response.status_code == 400


def test_duplicate_question_ids_rejected():
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 10, "difficulty": "easy"},
    ).json()
    answers = [{"question_id": q["id"], "answer": "A"} for q in started["questions"]]
    answers[1]["question_id"] = answers[0]["question_id"]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": answers, "difficulty": "easy", "question_count": 10},
    )
    assert response.status_code == 400


def test_partial_submission_rejected():
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 20, "difficulty": "easy"},
    ).json()
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={
            "answers": [{"question_id": started["questions"][0]["id"], "answer": "A"}],
            "difficulty": "easy",
            "question_count": 20,
        },
    )
    assert response.status_code == 400
    assert "exactly 20" in response.json()["detail"]


def test_mixed_difficulty_submission_rejected():
    key = seeded_answer_key()
    easy = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 10, "difficulty": "easy"},
    ).json()["questions"]
    hard = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 10, "difficulty": "hard"},
    ).json()["questions"]
    answers = [
        {"question_id": q["id"], "answer": key[q["id"]]}
        for q in (easy[:5] + hard[:5])
    ]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={
            "answers": answers,
            "difficulty": "easy",
            "question_count": 10,
        },
    )
    assert response.status_code == 400
    assert "difficulty" in response.json()["detail"].lower()


def test_passing_threshold():
    key = seeded_answer_key()
    started = client.post(
        "/api/quizzes/ohms-law/start",
        json={"question_count": 20, "difficulty": "medium"},
    ).json()
    answers = [
        {
            "question_id": q["id"],
            "answer": key[q["id"]] if index < 14 else wrong_letter(key[q["id"]]),
        }
        for index, q in enumerate(started["questions"])
    ]
    response = client.post(
        "/api/quizzes/ohms-law/submit",
        json={
            "answers": answers,
            "difficulty": "medium",
            "question_count": 20,
        },
    )
    assert response.json()["score"] == 70.0
    assert response.json()["passed"] is True


def test_quiz_bank_base_still_40_per_experiment():
    from app.data.quiz_bank import QUIZ_BANK

    assert len(QUIZ_BANK) == 10
    assert all(len(questions) == 40 for questions in QUIZ_BANK.values())
    assert sum(len(questions) for questions in QUIZ_BANK.values()) == 400


def test_enriched_seed_has_difficulty_pools():
    from app.data.quiz_bank import iter_questions

    rows = list(iter_questions())
    assert len(rows) == ENRICHED_TOTAL
    assert all(row["difficulty"] in DIFFICULTIES for row in rows)


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
        assert db.query(QuizQuestion).count() == ENRICHED_TOTAL


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
        # After enrichment, id 1 is the first easy question for ohms-law
        assert row.question != "STALE question text"
        assert row.difficulty in DIFFICULTIES
        assert row.correct_answer in ANSWER_LETTERS
