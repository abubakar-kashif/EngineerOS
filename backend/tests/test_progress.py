def test_get_progress_empty(progress_client):
    client, _ = progress_client

    response = client.get("/api/progress")

    assert response.status_code == 200
    assert response.json() == {
        "completed_experiments": 0,
        "completed_quizzes": 0,
        "average_quiz_score": 0.0,
        "overall_progress": 0.0,
    }


def test_post_progress_response_contract(progress_client):
    client, _ = progress_client

    response = client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law", "status": "completed"},
    )

    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"id", "experiment_id", "status", "updated_at"}
    assert isinstance(data["id"], int)
    assert data["experiment_id"] == "ohms-law"
    assert data["status"] == "completed"
    # Timezone-aware ISO timestamp so clients read it as UTC.
    assert data["updated_at"].endswith(("Z", "+00:00"))


def test_invalid_experiment_id_returns_404(progress_client):
    client, _ = progress_client

    response = client.post(
        "/api/progress",
        json={"experiment_id": "does-not-exist", "status": "completed"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Experiment not found"


def test_progress_summary_after_completion(progress_client):
    client, _ = progress_client

    client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law", "status": "completed"},
    )

    response = client.get("/api/progress")

    assert response.status_code == 200
    data = response.json()
    assert data["completed_experiments"] == 1
    assert data["completed_quizzes"] == 0
    assert data["average_quiz_score"] == 0.0
    assert data["overall_progress"] == 10.0


def test_dynamic_progress_percentage(progress_client):
    client, session_factory = progress_client

    client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law", "status": "completed"},
    )

    # Add an eleventh experiment to prove the denominator comes from the
    # experiments table rather than a hardcoded constant.
    with session_factory() as db:
        from app.models.experiment import Experiment

        db.add(
            Experiment(
                id="transformer-test",
                title="Transformer Test",
                slug="transformer-test",
                short_description="Test experiment",
                description="Test experiment description",
                objective="Test objective",
                theory="Test theory",
                difficulty="Beginner",
                category="Test",
                duration_minutes=30,
                status="active",
            )
        )
        db.commit()

    response = client.get("/api/progress")
    assert response.json()["overall_progress"] == round(1 / 11 * 100, 2)


def test_two_completed_experiments_are_20_percent(progress_client):
    client, _ = progress_client

    for experiment_id in ("ohms-law", "series-circuit"):
        response = client.post(
            "/api/progress",
            json={"experiment_id": experiment_id, "status": "completed"},
        )
        assert response.status_code == 200

    response = client.get("/api/progress")
    assert response.json()["completed_experiments"] == 2
    assert response.json()["overall_progress"] == 20.0


def test_repeated_post_updates_one_row(progress_client):
    client, session_factory = progress_client

    client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law", "status": "completed"},
    )
    client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law", "status": "in_progress"},
    )

    with session_factory() as db:
        from app.models.progress import Progress

        rows = db.query(Progress).filter(
            Progress.experiment_id == "ohms-law"
        ).all()
        assert len(rows) == 1
        assert rows[0].status == "in_progress"


def test_in_progress_to_completed_lifecycle(progress_client):
    client, _ = progress_client

    first = client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law", "status": "in_progress"},
    )
    assert first.status_code == 200

    second = client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law", "status": "completed"},
    )
    assert second.status_code == 200
    assert second.json()["status"] == "completed"

    summary = client.get("/api/progress").json()
    assert summary["completed_experiments"] == 1
    assert summary["overall_progress"] == 10.0


def test_invalid_status_rejected(progress_client):
    client, _ = progress_client

    response = client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law", "status": "finished"},
    )

    assert response.status_code == 422


def test_empty_experiment_id_rejected(progress_client):
    client, _ = progress_client

    response = client.post(
        "/api/progress",
        json={"experiment_id": "", "status": "completed"},
    )

    assert response.status_code == 422


def test_missing_status_rejected(progress_client):
    client, _ = progress_client

    response = client.post(
        "/api/progress",
        json={"experiment_id": "ohms-law"},
    )

    assert response.status_code == 422


def test_missing_experiment_id_rejected(progress_client):
    client, _ = progress_client

    response = client.post(
        "/api/progress",
        json={"status": "completed"},
    )

    assert response.status_code == 422
