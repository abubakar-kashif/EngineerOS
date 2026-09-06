"""Quiz difficulty constants and bank enrichment.

Phase 1: every question carries a real difficulty. Pools are expanded so each
experiment supports 10 / 20 / 40 attempts at easy, medium, and hard.
"""
from __future__ import annotations

import copy
from typing import Any, Iterable

DIFFICULTIES = ("easy", "medium", "hard")
ALLOWED_COUNTS = (10, 20, 40)
TARGET_PER_DIFFICULTY = 40

Difficulty = str  # "easy" | "medium" | "hard"


def _ohm_extra(difficulty: str, index: int) -> dict[str, Any]:
    # Deterministic numeric variants (unique question text per index).
    if difficulty == "easy":
        v, r = 5 + index, 5 + (index % 7)
        i = round(v / r, 4)
        return {
            "question": f"Easy check {index + 1}: {v} V across {r} Ω. Current is:",
            "option_a": f"{i} A",
            "option_b": f"{v * r} A",
            "option_c": f"{r / v} A",
            "option_d": f"{v + r} A",
            "correct_answer": "A",
            "explanation": f"I = V/R = {v}/{r} = {i} A.",
            "difficulty": "easy",
        }
    if difficulty == "medium":
        v, r = 12 + index, 3 + (index % 5)
        p = round((v * v) / r, 4)
        return {
            "question": f"Medium check {index + 1}: {v} V across {r} Ω. Power is:",
            "option_a": f"{p} W",
            "option_b": f"{v / r} W",
            "option_c": f"{v * r} W",
            "option_d": f"{r / v} W",
            "correct_answer": "A",
            "explanation": f"P = V²/R = {v}²/{r} = {p} W.",
            "difficulty": "medium",
        }
    v, r1, r2 = 24 + index, 4 + (index % 4), 8 + (index % 3)
    i = round(v / (r1 + r2), 4)
    return {
        "question": (
            f"Hard check {index + 1}: {v} V drives {r1} Ω and {r2} Ω in series. "
            f"Loop current is:"
        ),
        "option_a": f"{i} A",
        "option_b": f"{v / r1} A",
        "option_c": f"{v / r2} A",
        "option_d": f"{v * (r1 + r2)} A",
        "correct_answer": "A",
        "explanation": f"I = V/(R1+R2) = {v}/({r1}+{r2}) = {i} A.",
        "difficulty": "hard",
    }


def _generic_extra(experiment_id: str, difficulty: str, index: int) -> dict[str, Any]:
    """Topic-aware fillers so every experiment reaches 40 per difficulty."""
    topic = experiment_id.replace("-", " ")
    label = difficulty.capitalize()
    n = index + 1
    if difficulty == "easy":
        return {
            "question": f"{label} {topic} fact #{n}: which statement is true?",
            "option_a": f"Core {topic} relationships must be applied carefully",
            "option_b": f"{topic} never uses Ohm's law",
            "option_c": f"{topic} ignores voltage entirely",
            "option_d": f"{topic} only uses mechanical gears",
            "correct_answer": "A",
            "explanation": f"Basic {topic} questions reinforce core ideas.",
            "difficulty": "easy",
        }
    if difficulty == "medium":
        return {
            "question": f"{label} {topic} analysis #{n}: the next step is to:",
            "option_a": f"Apply the governing {topic} equations to the circuit",
            "option_b": f"Ignore measured values",
            "option_c": f"Remove the ground always",
            "option_d": f"Double every resistor randomly",
            "correct_answer": "A",
            "explanation": f"Medium {topic} items require applying equations.",
            "difficulty": "medium",
        }
    return {
        "question": f"{label} {topic} troubleshooting #{n}: a surprising reading means:",
        "option_a": f"Recheck assumptions and recompute with {topic} laws",
        "option_b": f"Delete the experiment",
        "option_c": f"Assume the meter is always wrong",
        "option_d": f"Ignore polarity and ground",
        "correct_answer": "A",
        "explanation": f"Hard {topic} items emphasize diagnosis and verification.",
        "difficulty": "hard",
    }


def _make_extra(experiment_id: str, difficulty: str, index: int) -> dict[str, Any]:
    if experiment_id == "ohms-law":
        return _ohm_extra(difficulty, index)
    return _generic_extra(experiment_id, difficulty, index)


def enrich_questions(
    experiment_id: str,
    questions: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Tag base questions with difficulty and expand pools to TARGET_PER_DIFFICULTY."""
    base = [copy.deepcopy(q) for q in questions]
    for i, q in enumerate(base):
        if q.get("difficulty") not in DIFFICULTIES:
            q["difficulty"] = DIFFICULTIES[i % 3]

    by_diff: dict[str, list[dict[str, Any]]] = {d: [] for d in DIFFICULTIES}
    for q in base:
        by_diff[q["difficulty"]].append(q)

    for difficulty in DIFFICULTIES:
        need = TARGET_PER_DIFFICULTY - len(by_diff[difficulty])
        for i in range(max(0, need)):
            by_diff[difficulty].append(_make_extra(experiment_id, difficulty, i))

    # Stable order: easy block, medium block, hard block (seed IDs stay deterministic).
    ordered: list[dict[str, Any]] = []
    for difficulty in DIFFICULTIES:
        ordered.extend(by_diff[difficulty][:TARGET_PER_DIFFICULTY])
    return ordered


def count_by_difficulty(questions: Iterable[dict[str, Any] | Any]) -> dict[str, int]:
    counts = {d: 0 for d in DIFFICULTIES}
    for q in questions:
        difficulty = q["difficulty"] if isinstance(q, dict) else getattr(q, "difficulty", None)
        if difficulty in counts:
            counts[difficulty] += 1
    return counts
