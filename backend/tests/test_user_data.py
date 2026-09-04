"""Phase 9 user-owned data tests.

Covers profile and preferences, session management, notifications,
conversation ownership, the Quiz -> Attempt -> Progress chain, per-user
progress/report scoping, and the anonymous (legacy) behaviour.
"""

from app.data.quiz_bank import iter_questions
from app.models.quiz import QuizAttempt
from app.models.user import User


def register_user(client, email, name="Ada Lovelace", password="supersecret1", *, verify=True):
    """Register a user. Verifies email by default so login/session tests work."""
    response = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    assert response.status_code == 201
    data = response.json()
    if verify:
        code = data.get("dev_code")
        assert isinstance(code, str)
        verified = client.post(
            "/api/auth/verify",
            json={"email": email, "code": code},
        )
        assert verified.status_code == 200
        data["user"]["email_verified"] = True
    return data


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def register_headers(client, email):
    """Register a user and return ready-to-use Authorization headers."""
    return bearer(register_user(client, email)["token"])


def quiz_answer_key(experiment_id="ohms-law"):
    """The bank's answer key, matched by question text."""
    return {
        item["question"]: item["correct_answer"]
        for item in iter_questions()
        if item["experiment_id"] == experiment_id
    }


WRONG_LETTER = {"A": "B", "B": "C", "C": "D", "D": "A"}


def perfect_quiz_answers(client, experiment_id="ohms-law"):
    key = quiz_answer_key(experiment_id)
    questions = client.get(f"/api/quizzes/{experiment_id}").json()["questions"]
    return [
        {"question_id": question["id"], "answer": key[question["question"]]}
        for question in questions
    ]


def failing_quiz_answers(client, experiment_id="ohms-law"):
    """Every question answered with a wrong letter."""
    key = quiz_answer_key(experiment_id)
    questions = client.get(f"/api/quizzes/{experiment_id}").json()["questions"]
    return [
        {
            "question_id": question["id"],
            "answer": WRONG_LETTER[key[question["question"]]],
        }
        for question in questions
    ]


def create_conversation(client, headers, **payload):
    response = client.post("/api/conversations", headers=headers, json=payload or {})
    assert response.status_code == 201
    return response.json()


# --- Profile ------------------------------------------------------------------


def test_get_my_profile(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "profile@example.com")

    response = client.get("/api/users/me", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile@example.com"
    assert data["name"] == "Ada Lovelace"
    assert "password_hash" not in data
    assert data["preferences"]["notify_quiz_results"] is True
    assert data["sessions"]  # the registration session is live


def test_update_profile(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "update@example.com")

    response = client.patch(
        "/api/users/me",
        headers=headers,
        json={"name": "Grace Hopper", "avatar_url": "https://example.com/a.png"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Grace Hopper"
    assert data["avatar_url"] == "https://example.com/a.png"


def test_update_profile_requires_authentication(phase9_client):
    client, _ = phase9_client

    response = client.patch("/api/users/me", json={"name": "Nobody"})

    assert response.status_code == 401


# --- Preferences ----------------------------------------------------------------


def test_preferences_defaults(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "prefs@example.com")

    response = client.get("/api/users/me/preferences", headers=headers)

    assert response.status_code == 200
    assert response.json() == {
        "theme": "dark",
        "preferred_difficulty": "Beginner",
        "learning_reminders": False,
        "default_experiment_view": "overview",
        "notify_quiz_results": True,
        "notify_report_completion": True,
        "notify_learning_reminders": False,
        "notify_email": True,
        "notify_activity": True,
    }


def test_update_theme_preference_persists(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "theme@example.com")

    response = client.patch(
        "/api/users/me/preferences", headers=headers, json={"theme": "light"}
    )

    assert response.status_code == 200
    assert response.json()["theme"] == "light"

    # Persisted: a fresh read — and /auth/me — still report the new theme.
    assert (
        client.get("/api/users/me/preferences", headers=headers).json()["theme"]
        == "light"
    )
    me = client.get("/api/auth/me", headers=headers)
    assert me.json()["user"]["preferences"]["theme"] == "light"


def test_preferences_partial_update_leaves_other_fields(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "partial@example.com")

    response = client.patch(
        "/api/users/me/preferences",
        headers=headers,
        json={"learning_reminders": True},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["learning_reminders"] is True
    assert data["theme"] == "dark"  # untouched


def test_update_notification_preferences_persist(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "notif-prefs@example.com")

    response = client.patch(
        "/api/users/me/preferences",
        headers=headers,
        json={"notify_email": False, "notify_activity": False},
    )

    assert response.status_code == 200
    assert response.json()["notify_email"] is False
    assert response.json()["notify_activity"] is False

    # Persisted on a fresh read — the other toggles stay untouched.
    refreshed = client.get("/api/users/me/preferences", headers=headers).json()
    assert refreshed["notify_email"] is False
    assert refreshed["notify_activity"] is False
    assert refreshed["notify_quiz_results"] is True


def test_invalid_theme_rejected(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "badtheme@example.com")

    response = client.patch(
        "/api/users/me/preferences", headers=headers, json={"theme": "neon"}
    )

    assert response.status_code == 422


# --- Password and sessions -------------------------------------------------------


def test_change_password_requires_correct_current_password(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "pw@example.com")

    response = client.put(
        "/api/users/me/password",
        headers=headers,
        json={
            "current_password": "not-the-password",
            "new_password": "brand-new-password",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Your current password is incorrect."


def test_change_password_keeps_current_session_and_revokes_others(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "rotate@example.com")

    other = client.post(
        "/api/auth/login",
        json={"email": "rotate@example.com", "password": "supersecret1"},
    ).json()
    other_headers = bearer(other["token"])
    assert client.get("/api/auth/me", headers=other_headers).status_code == 200

    response = client.put(
        "/api/users/me/password",
        headers=bearer(registered["token"]),
        json={
            "current_password": "supersecret1",
            "new_password": "brand-new-password",
        },
    )

    assert response.status_code == 200
    assert "1 other session(s)" in response.json()["message"]
    # The session used to change the password stays valid...
    assert (
        client.get("/api/auth/me", headers=bearer(registered["token"])).status_code
        == 200
    )
    # ...the other device was signed out.
    assert client.get("/api/auth/me", headers=other_headers).status_code == 401
    # The new password works.
    assert (
        client.post(
            "/api/auth/login",
            json={"email": "rotate@example.com", "password": "brand-new-password"},
        ).status_code
        == 200
    )


def test_sign_out_other_sessions(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "sessions@example.com")

    other = client.post(
        "/api/auth/login",
        json={"email": "sessions@example.com", "password": "supersecret1"},
    ).json()
    other_headers = bearer(other["token"])

    response = client.delete(
        "/api/users/me/sessions", headers=bearer(registered["token"])
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Signed out 1 other session(s)."
    assert client.get("/api/auth/me", headers=other_headers).status_code == 401
    assert (
        client.get("/api/auth/me", headers=bearer(registered["token"])).status_code
        == 200
    )

    # Revoking again reports there is nothing left to revoke.
    again = client.delete(
        "/api/users/me/sessions", headers=bearer(registered["token"])
    )
    assert again.json()["message"] == "No other active sessions found."


def test_sessions_list_flags_only_the_current_one(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "devices@example.com")
    client.post(
        "/api/auth/login",
        json={"email": "devices@example.com", "password": "supersecret1"},
    )

    response = client.get("/api/users/me", headers=bearer(registered["token"]))

    sessions = response.json()["sessions"]
    assert len(sessions) == 2
    assert sum(1 for session in sessions if session["current"]) == 1
    current = next(session for session in sessions if session["current"])
    assert current["user_agent"]  # TestClient sends a user-agent header


def test_revoke_single_session(phase9_client):
    client, _ = phase9_client
    registered = register_user(client, "revoke-one@example.com")
    other = client.post(
        "/api/auth/login",
        json={"email": "revoke-one@example.com", "password": "supersecret1"},
    ).json()

    sessions = client.get("/api/users/me", headers=bearer(registered["token"])).json()[
        "sessions"
    ]
    other_id = next(session["id"] for session in sessions if not session["current"])

    response = client.delete(
        f"/api/users/me/sessions/{other_id}", headers=bearer(registered["token"])
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Session revoked."
    assert client.get("/api/auth/me", headers=bearer(other["token"])).status_code == 401
    assert (
        client.get("/api/auth/me", headers=bearer(registered["token"])).status_code
        == 200
    )


def test_revoke_unknown_session_not_found(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "revoke-missing@example.com")

    response = client.delete("/api/users/me/sessions/deadbeef", headers=headers)

    assert response.status_code == 404


def test_revoke_session_ownership_enforced(phase9_client):
    client, _ = phase9_client
    owner_headers = register_headers(client, "session-owner@example.com")
    owner_session_id = client.get("/api/users/me", headers=owner_headers).json()[
        "sessions"
    ][0]["id"]

    intruder_headers = register_headers(client, "session-intruder@example.com")

    response = client.delete(
        f"/api/users/me/sessions/{owner_session_id}", headers=intruder_headers
    )

    # The intruder gets a plain 404 — no hint that the session exists.
    assert response.status_code == 404
    assert client.get("/api/auth/me", headers=owner_headers).status_code == 200


# --- Notifications ----------------------------------------------------------------


def test_register_creates_welcome_notification(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "notify@example.com")

    response = client.get("/api/notifications", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["unread_count"] == 1
    assert data["items"][0]["type"] == "welcome"
    assert data["items"][0]["read"] is False


def test_mark_notification_read(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "read@example.com")
    notifications = client.get("/api/notifications", headers=headers).json()
    notification_id = notifications["items"][0]["id"]

    response = client.post(
        f"/api/notifications/{notification_id}/read", headers=headers
    )

    assert response.status_code == 200
    assert response.json()["read"] is True
    refreshed = client.get("/api/notifications", headers=headers).json()
    assert refreshed["unread_count"] == 0


def test_mark_unknown_notification_not_found(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "missing@example.com")

    response = client.post("/api/notifications/9999/read", headers=headers)

    assert response.status_code == 404


def test_notification_ownership_enforced(phase9_client):
    client, _ = phase9_client
    owner_headers = register_headers(client, "owner@example.com")
    intruder_headers = register_headers(client, "intruder@example.com")

    owner_notification = client.get(
        "/api/notifications", headers=owner_headers
    ).json()["items"][0]

    # The intruder only ever sees their own notifications...
    assert client.get("/api/notifications", headers=intruder_headers).json()["total"] == 1
    # ...and cannot mark someone else's notification as read (404, not 403).
    response = client.post(
        f"/api/notifications/{owner_notification['id']}/read",
        headers=intruder_headers,
    )
    assert response.status_code == 404

    # The owner's notification is still unread.
    assert (
        client.get("/api/notifications", headers=owner_headers).json()["unread_count"]
        == 1
    )


def test_mark_all_notifications_read(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "allread@example.com")

    # A quiz submission adds a second notification.
    submission = client.post(
        "/api/quizzes/ohms-law/submit",
        headers=headers,
        json={"answers": perfect_quiz_answers(client)},
    )
    assert submission.status_code == 200
    assert (
        client.get("/api/notifications", headers=headers).json()["unread_count"] == 2
    )

    response = client.post("/api/notifications/read-all", headers=headers)

    assert response.status_code == 200
    assert response.json()["updated"] == 2
    assert (
        client.get("/api/notifications", headers=headers).json()["unread_count"] == 0
    )


# --- Conversations ----------------------------------------------------------------


def test_conversation_lifecycle(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "chat@example.com")

    created = create_conversation(
        client, headers, title="Ohm's Law Help", experiment_id="ohms-law"
    )
    assert created["title"] == "Ohm's Law Help"
    assert created["experiment_id"] == "ohms-law"
    assert created["messages"] == []

    # A second conversation with the default title.
    create_conversation(client, headers)

    summaries = client.get("/api/conversations", headers=headers).json()
    assert len(summaries) == 2
    assert all(summary["message_count"] == 0 for summary in summaries)


def test_add_message_and_read_conversation(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "msg@example.com")
    conversation = create_conversation(client, headers)

    message = client.post(
        f"/api/conversations/{conversation['id']}/messages",
        headers=headers,
        json={"role": "user", "content": "What is Ohm's law?"},
    )
    assert message.status_code == 201
    assert message.json()["role"] == "user"
    assert message.json()["content"] == "What is Ohm's law?"

    # Clients must not invent assistant turns (Mentor service writes those).
    reply = client.post(
        f"/api/conversations/{conversation['id']}/messages",
        headers=headers,
        json={
            "role": "assistant",
            "content": "V = I x R.",
            "metadata": {"is_simulated": True},
        },
    )
    assert reply.status_code == 403

    detail = client.get(
        f"/api/conversations/{conversation['id']}", headers=headers
    )
    assert detail.status_code == 200
    assert len(detail.json()["messages"]) == 1

    listed = client.get(
        f"/api/conversations/{conversation['id']}/messages", headers=headers
    )
    assert [item["role"] for item in listed.json()] == ["user"]

    # The message count shows up in the sidebar summary.
    summaries = client.get("/api/conversations", headers=headers).json()
    assert summaries[0]["message_count"] == 1


def test_rename_conversation(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "rename@example.com")
    conversation = create_conversation(client, headers)

    response = client.patch(
        f"/api/conversations/{conversation['id']}",
        headers=headers,
        json={"title": "Renamed"},
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Renamed"


def test_delete_conversation(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "delete@example.com")
    conversation = create_conversation(client, headers)

    response = client.delete(
        f"/api/conversations/{conversation['id']}", headers=headers
    )

    assert response.status_code == 204
    assert (
        client.get(
            f"/api/conversations/{conversation['id']}", headers=headers
        ).status_code
        == 404
    )
    assert client.get("/api/conversations", headers=headers).json() == []


def test_message_feedback_set_and_cleared(phase9_client):
    client, session_factory = phase9_client
    headers = register_headers(client, "feedback@example.com")
    conversation = create_conversation(client, headers)

    # Assistant rows are written by Mentor (service), not the public POST route.
    from app.schemas.conversation import MessageCreateRequest
    from app.services import conversation_service

    with session_factory() as db:
        user = db.query(User).filter(User.email == "feedback@example.com").one()
        message = conversation_service.add_message(
            db,
            user.id,
            conversation["id"],
            MessageCreateRequest(role="assistant", content="An answer"),
        )
        message_id = message.id

    set_response = client.patch(
        f"/api/conversations/{conversation['id']}/messages/{message_id}",
        headers=headers,
        json={"feedback": "helpful"},
    )
    assert set_response.status_code == 200
    assert set_response.json()["feedback"] == "helpful"

    cleared = client.patch(
        f"/api/conversations/{conversation['id']}/messages/{message_id}",
        headers=headers,
        json={"feedback": None},
    )
    assert cleared.status_code == 200
    assert cleared.json()["feedback"] is None


def test_message_feedback_unknown_message(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "nofeedback@example.com")
    conversation = create_conversation(client, headers)

    response = client.patch(
        f"/api/conversations/{conversation['id']}/messages/does-not-exist",
        headers=headers,
        json={"feedback": "helpful"},
    )

    assert response.status_code == 404


def test_message_validation(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "validate@example.com")
    conversation = create_conversation(client, headers)

    empty = client.post(
        f"/api/conversations/{conversation['id']}/messages",
        headers=headers,
        json={"role": "user", "content": ""},
    )
    assert empty.status_code == 422

    bad_role = client.post(
        f"/api/conversations/{conversation['id']}/messages",
        headers=headers,
        json={"role": "robot", "content": "Beep"},
    )
    assert bad_role.status_code == 422


def test_conversation_ownership_returns_404(phase9_client):
    """Foreign conversation ids behave exactly like missing ones (404, not 403)."""
    client, _ = phase9_client
    owner_headers = register_headers(client, "convowner@example.com")
    intruder_headers = register_headers(client, "convintruder@example.com")

    conversation = create_conversation(client, owner_headers, title="Private")
    conversation_id = conversation["id"]

    assert (
        client.get(
            f"/api/conversations/{conversation_id}", headers=intruder_headers
        ).status_code
        == 404
    )
    assert (
        client.get(
            f"/api/conversations/{conversation_id}/messages",
            headers=intruder_headers,
        ).status_code
        == 404
    )
    assert (
        client.patch(
            f"/api/conversations/{conversation_id}",
            headers=intruder_headers,
            json={"title": "Stolen"},
        ).status_code
        == 404
    )
    assert (
        client.post(
            f"/api/conversations/{conversation_id}/messages",
            headers=intruder_headers,
            json={"role": "user", "content": "hi"},
        ).status_code
        == 404
    )
    assert (
        client.delete(
            f"/api/conversations/{conversation_id}", headers=intruder_headers
        ).status_code
        == 404
    )

    # The conversation still exists, untouched, for its owner...
    detail = client.get(
        f"/api/conversations/{conversation_id}", headers=owner_headers
    )
    assert detail.status_code == 200
    assert detail.json()["title"] == "Private"
    # ...and never appears in the intruder's list.
    assert client.get("/api/conversations", headers=intruder_headers).json() == []


# --- Quiz -> Attempt -> Score -> Progress chain -------------------------------------


def test_quiz_submission_records_attempt_progress_and_notification(phase9_client):
    client, session_factory = phase9_client
    registered = register_user(client, "quiz@example.com")
    headers = bearer(registered["token"])

    submission = client.post(
        "/api/quizzes/ohms-law/submit",
        headers=headers,
        json={"answers": perfect_quiz_answers(client)},
    )

    assert submission.status_code == 200
    assert submission.json() == {
        "score": 100.0,
        "total_questions": 40,
        "correct_answers": 40,
        "passed": True,
    }

    # The attempt is persisted with the submitted answers and the grade.
    with session_factory() as db:
        attempt = db.query(QuizAttempt).one()
        assert attempt.user_id == registered["user"]["id"]
        assert attempt.experiment_id == "ohms-law"
        assert attempt.score == 100.0
        assert attempt.passed is True
        assert len(attempt.answers) == 40

    # Passing completes the experiment for this user.
    progress_rows = client.get("/api/progress/me", headers=headers).json()
    assert [row["experiment_id"] for row in progress_rows] == ["ohms-law"]
    assert progress_rows[0]["status"] == "completed"

    summary = client.get("/api/progress", headers=headers).json()
    assert summary["completed_experiments"] == 1
    assert summary["completed_quizzes"] == 1
    assert summary["average_quiz_score"] == 100.0

    # A result notification was created with the outcome metadata.
    notifications = client.get("/api/notifications", headers=headers).json()
    quiz_result = next(
        item for item in notifications["items"] if item["type"] == "quiz_result"
    )
    assert quiz_result["metadata"]["experiment_id"] == "ohms-law"
    assert quiz_result["metadata"]["score"] == 100.0


def test_failed_quiz_records_attempt_without_completing_progress(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "fail@example.com")

    submission = client.post(
        "/api/quizzes/ohms-law/submit",
        headers=headers,
        json={"answers": failing_quiz_answers(client)},
    )

    assert submission.status_code == 200
    assert submission.json()["passed"] is False
    # No progress row is created for a failing attempt...
    assert client.get("/api/progress/me", headers=headers).json() == []
    # ...but the attempt still counts towards quiz statistics.
    summary = client.get("/api/progress", headers=headers).json()
    assert summary["completed_experiments"] == 0
    assert summary["completed_quizzes"] == 1
    assert summary["average_quiz_score"] == 0.0


def test_anonymous_quiz_submission_stays_stateless(phase9_client):
    client, _ = phase9_client

    submission = client.post(
        "/api/quizzes/ohms-law/submit",
        json={"answers": perfect_quiz_answers(client)},
    )

    assert submission.status_code == 200
    assert submission.json()["passed"] is True
    # Anonymous submissions record nothing anywhere.
    summary = client.get("/api/progress").json()
    assert summary["completed_experiments"] == 0
    assert summary["completed_quizzes"] == 0


def test_quiz_attempt_history_lists_newest_first(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "history@example.com")

    # A failing attempt first, then a perfect one.
    failed = client.post(
        "/api/quizzes/ohms-law/submit",
        headers=headers,
        json={"answers": failing_quiz_answers(client)},
    )
    assert failed.status_code == 200
    perfect = client.post(
        "/api/quizzes/ohms-law/submit",
        headers=headers,
        json={"answers": perfect_quiz_answers(client)},
    )
    assert perfect.status_code == 200

    response = client.get("/api/quizzes/me/attempts", headers=headers)

    assert response.status_code == 200
    attempts = response.json()
    assert len(attempts) == 2
    assert attempts[0]["experiment_id"] == "ohms-law"
    assert attempts[0]["score"] == 100.0
    assert attempts[0]["passed"] is True
    assert attempts[1]["passed"] is False
    # Timestamps are timezone-aware so clients read them as UTC.
    assert attempts[0]["created_at"].endswith(("Z", "+00:00"))


def test_quiz_attempt_history_scoped_per_user(phase9_client):
    client, _ = phase9_client
    alice = register_headers(client, "history-alice@example.com")
    bob = register_headers(client, "history-bob@example.com")

    submission = client.post(
        "/api/quizzes/ohms-law/submit",
        headers=alice,
        json={"answers": perfect_quiz_answers(client)},
    )
    assert submission.status_code == 200

    assert client.get("/api/quizzes/me/attempts", headers=bob).json() == []
    assert len(client.get("/api/quizzes/me/attempts", headers=alice).json()) == 1


def test_quiz_attempt_history_requires_authentication(phase9_client):
    client, _ = phase9_client

    response = client.get("/api/quizzes/me/attempts")

    assert response.status_code == 401


# --- Progress scoping -----------------------------------------------------------------


def test_progress_is_scoped_per_user(phase9_client):
    client, _ = phase9_client
    alice = register_headers(client, "alice@example.com")
    bob = register_headers(client, "bob@example.com")

    assert (
        client.post(
            "/api/progress",
            headers=alice,
            json={"experiment_id": "ohms-law", "status": "completed"},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/progress",
            headers=bob,
            json={"experiment_id": "series-circuit", "status": "in_progress"},
        ).status_code
        == 200
    )

    # Each user only sees their own rows.
    alice_rows = client.get("/api/progress/me", headers=alice).json()
    assert [row["experiment_id"] for row in alice_rows] == ["ohms-law"]
    bob_rows = client.get("/api/progress/me", headers=bob).json()
    assert [row["experiment_id"] for row in bob_rows] == ["series-circuit"]

    assert client.get("/api/progress", headers=alice).json()[
        "completed_experiments"
    ] == 1
    assert client.get("/api/progress", headers=bob).json()[
        "completed_experiments"
    ] == 0


def test_progress_upsert_updates_existing_row(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "upsert@example.com")

    client.post(
        "/api/progress",
        headers=headers,
        json={"experiment_id": "kcl", "status": "in_progress"},
    )
    response = client.post(
        "/api/progress",
        headers=headers,
        json={"experiment_id": "kcl", "status": "completed"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    rows = client.get("/api/progress/me", headers=headers).json()
    assert len(rows) == 1
    assert rows[0]["status"] == "completed"


def test_anonymous_progress_writes_legacy_ownerless_row(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "scoped@example.com")

    # Anonymous write lands on the shared legacy row (user_id NULL)...
    assert (
        client.post(
            "/api/progress", json={"experiment_id": "kvl", "status": "completed"}
        ).status_code
        == 200
    )

    # ...and never leaks into the authenticated user's numbers.
    assert (
        client.get("/api/progress", headers=headers).json()["completed_experiments"]
        == 0
    )
    assert client.get("/api/progress/me", headers=headers).json() == []

    # The anonymous summary reports the legacy row instead.
    assert client.get("/api/progress").json()["completed_experiments"] == 1


# --- Reports scoping --------------------------------------------------------------------


def test_reports_are_scoped_to_their_owner(phase9_client):
    client, _ = phase9_client
    alice = register_headers(client, "alice@example.com")
    bob = register_headers(client, "bob@example.com")

    alice_report = client.post(
        "/api/reports",
        headers=alice,
        json={"experiment_id": "ohms-law", "title": "Alice's Report"},
    ).json()
    bob_report = client.post(
        "/api/reports",
        headers=bob,
        json={"experiment_id": "ohms-law", "title": "Bob's Report"},
    ).json()

    assert [report["title"] for report in client.get("/api/reports", headers=alice).json()] == [
        "Alice's Report"
    ]
    assert [report["title"] for report in client.get("/api/reports", headers=bob).json()] == [
        "Bob's Report"
    ]

    # Cross-owner detail access is a 404, not a 403 (no resource enumeration).
    assert (
        client.get(f"/api/reports/{bob_report['id']}", headers=alice).status_code
        == 404
    )
    assert (
        client.get(f"/api/reports/{alice_report['id']}", headers=bob).status_code
        == 404
    )


def test_report_generation_notifies_the_owner(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "report@example.com")

    response = client.post(
        "/api/reports",
        headers=headers,
        json={"experiment_id": "ohms-law", "title": "My Lab Report"},
    )

    assert response.status_code == 201
    notifications = client.get("/api/notifications", headers=headers).json()
    report_notification = next(
        item for item in notifications["items"] if item["type"] == "report"
    )
    assert "My Lab Report" in report_notification["message"]
    assert report_notification["metadata"]["experiment_id"] == "ohms-law"


def test_anonymous_reports_stay_ownerless(phase9_client):
    client, _ = phase9_client
    headers = register_headers(client, "owner@example.com")

    created = client.post(
        "/api/reports",
        json={"experiment_id": "ohms-law", "title": "Anonymous Report"},
    )
    assert created.status_code == 201

    # The authenticated user never sees the anonymous report...
    assert client.get("/api/reports", headers=headers).json() == []
    # ...while anonymous listing keeps the legacy behaviour (ownerless rows).
    anonymous_list = client.get("/api/reports").json()
    assert [report["title"] for report in anonymous_list] == ["Anonymous Report"]
    assert anonymous_list[0]["user_id"] is None
