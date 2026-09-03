"""Lightweight SQLite schema migrations for pre-Phase-9 databases.

Phase 9 added new tables (users, session_tokens, user_preferences,
conversations, conversation_messages, notifications, simulation_runs,
quiz_attempts) — those are created by ``Base.metadata.create_all``. It also
changed two existing tables:

* ``progress`` gained ``user_id`` / ``updated_at`` and replaced the
  experiment-only unique constraint with (user_id, experiment_id).
* ``reports`` gained ``user_id`` / ``created_at``.
* ``session_tokens`` gained ``user_agent`` and ``user_preferences`` gained
* ``notify_email`` / ``notify_activity`` (additive — plain ALTER TABLE).

SQLite cannot drop or alter constraints, so the affected tables are rebuilt
from the current models with existing rows copied across. The routine is
idempotent: fresh databases and already-migrated databases are no-ops.
"""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from app.models.progress import Progress
from app.models.report import Report


def _columns(engine: Engine, table: str) -> set[str]:
    inspector = inspect(engine)
    if not inspector.has_table(table):
        return set()
    return {column["name"] for column in inspector.get_columns(table)}


def _rebuild_progress(engine: Engine) -> None:
    """Recreate ``progress`` with per-user ownership, preserving legacy rows."""
    columns = _columns(engine, "progress")
    if not columns or "user_id" in columns:
        return

    with engine.begin() as connection:
        legacy_rows = connection.execute(
            text("SELECT id, experiment_id, status FROM progress")
        ).fetchall()
        connection.execute(text("DROP TABLE progress"))

    Progress.__table__.create(bind=engine)

    if legacy_rows:
        with engine.begin() as connection:
            for row in legacy_rows:
                connection.execute(
                    text(
                        "INSERT INTO progress "
                        "(id, experiment_id, status, user_id, updated_at) "
                        "VALUES (:id, :experiment_id, :status, NULL, CURRENT_TIMESTAMP)"
                    ),
                    {
                        "id": row.id,
                        "experiment_id": row.experiment_id,
                        "status": row.status,
                    },
                )


def _rebuild_reports(engine: Engine) -> None:
    """Recreate ``reports`` with ownership + created_at, preserving legacy rows."""
    columns = _columns(engine, "reports")
    if not columns or "user_id" in columns:
        return

    with engine.begin() as connection:
        legacy_rows = connection.execute(
            text(
                "SELECT id, experiment_id, title, observations, conclusion, status "
                "FROM reports"
            )
        ).fetchall()
        connection.execute(text("DROP TABLE reports"))

    Report.__table__.create(bind=engine)

    if legacy_rows:
        with engine.begin() as connection:
            for row in legacy_rows:
                connection.execute(
                    text(
                        "INSERT INTO reports "
                        "(id, experiment_id, title, observations, conclusion, status, user_id, created_at) "
                        "VALUES (:id, :experiment_id, :title, :observations, :conclusion, :status, NULL, CURRENT_TIMESTAMP)"
                    ),
                    {
                        "id": row.id,
                        "experiment_id": row.experiment_id,
                        "title": row.title,
                        "observations": row.observations,
                        "conclusion": row.conclusion,
                        "status": row.status,
                    },
                )


def _add_column(engine: Engine, table: str, column: str, ddl_type: str) -> None:
    """Additive column migration (idempotent).

    A missing table is a no-op: ``create_all`` will create it fresh with
    every column already in place.
    """
    columns = _columns(engine, table)
    if not columns or column in columns:
        return
    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))


def run_migrations(engine: Engine) -> None:
    """Bring a pre-Phase-9 database up to the current schema (idempotent)."""
    _rebuild_progress(engine)
    _rebuild_reports(engine)
    _add_column(engine, "session_tokens", "user_agent", "VARCHAR(500)")
    _add_column(engine, "user_preferences", "notify_email", "BOOLEAN NOT NULL DEFAULT 1")
    _add_column(engine, "user_preferences", "notify_activity", "BOOLEAN NOT NULL DEFAULT 1")
    # Phase 4 — structured experiment content (SQLite accepts the JSON
    # type name in ALTER TABLE; values are serialized by SQLAlchemy).
    _add_column(engine, "experiments", "historical_background", "TEXT")
    for column in (
        "learning_outcomes",
        "prerequisites",
        "formulas",
        "variables",
        "components",
        "circuit_diagram",
        "procedure",
        "expected_results",
        "common_mistakes",
        "safety_precautions",
        "observation_guidance",
        "real_world_applications",
        "related_experiments",
        "simulation_configuration",
    ):
        _add_column(engine, "experiments", column, "JSON")
    # Phase 10 — richer simulation runs (circuit definition + results)
    _add_column(engine, "simulation_runs", "name", "VARCHAR(200)")
    _add_column(engine, "simulation_runs", "circuit_definition", "JSON")
    _add_column(engine, "simulation_runs", "validation_errors", "JSON")
    _add_column(engine, "simulation_runs", "results", "JSON")
    _add_column(engine, "simulation_runs", "measurements", "JSON")
    _add_column(engine, "simulation_runs", "updated_at", "DATETIME")
    # Phase 7 — structured lab-report document (additive columns; JSON
    # values are serialized by SQLAlchemy).
    _add_column(engine, "reports", "student_name", "VARCHAR(200)")
    _add_column(engine, "reports", "objective", "TEXT")
    _add_column(engine, "reports", "theory", "TEXT")
    _add_column(engine, "reports", "historical_background", "TEXT")
    for column in (
        "components",
        "circuit_diagram",
        "procedure",
        "theoretical_results",
        "measured_results",
        "calculated_results",
        "percentage_error",
        "quiz_performance",
    ):
        _add_column(engine, "reports", column, "JSON")
