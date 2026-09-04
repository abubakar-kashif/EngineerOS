"""Generate frontend/src/data/quiz/quizBankExtra.ts from quiz_bank_extra.py."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.data.quiz_bank_extra import QUIZ_BANK_EXTRA  # noqa: E402
from app.data.quiz_bank import QUIZ_BANK  # noqa: E402


def esc(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def main() -> None:
    lines: list[str] = [
        'import type { AnswerLetter } from "../../types/quiz";',
        'import type { SeedQuizQuestion } from "./quizBank";',
        "",
        "/** Phase 2 extras — kept in sync with backend quiz_bank_extra.py. */",
        "export const QUIZ_BANK_EXTRA: Record<string, SeedQuizQuestion[]> = {",
    ]
    for experiment_id, questions in QUIZ_BANK_EXTRA.items():
        lines.append(f"  {esc(experiment_id)}: [")
        for question in questions:
            options = [
                question["option_a"],
                question["option_b"],
                question["option_c"],
                question["option_d"],
            ]
            lines.append(
                "    { question: "
                + esc(question["question"])
                + ", options: ["
                + ", ".join(esc(option) for option in options)
                + "], correct_answer: "
                + esc(question["correct_answer"])
                + " as AnswerLetter, explanation: "
                + esc(question["explanation"])
                + " },"
            )
        lines.append("  ],")
    lines.append("};")
    lines.append("")

    out = ROOT / "frontend" / "src" / "data" / "quiz" / "quizBankExtra.ts"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out}")
    for experiment_id, questions in QUIZ_BANK.items():
        print(f"{experiment_id}: {len(questions)}")
    print("total", sum(len(questions) for questions in QUIZ_BANK.values()))


if __name__ == "__main__":
    main()
