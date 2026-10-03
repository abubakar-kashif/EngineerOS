"""Write the frontend mirror of quiz_pool_topup.py."""
import json
from pathlib import Path

from app.data.quiz_pool_topup import QUIZ_POOL_TOPUP

lines = [
    'import type { AnswerLetter, QuizCategory } from "../../types/quiz";',
    'import type { SeedQuizQuestion } from "./quizBank";',
    "",
    "/** Mirrored from backend/app/data/quiz_pool_topup.py. */",
    "export const QUIZ_POOL_TOPUP: Record<string, SeedQuizQuestion[]> = {",
]
for experiment_id, items in QUIZ_POOL_TOPUP.items():
    lines.append(f"  {json.dumps(experiment_id)}: [")
    for item in items:
        options = [item["option_a"], item["option_b"], item["option_c"], item["option_d"]]
        lines.append("    {")
        lines.append(f"      question: {json.dumps(item['question'])},")
        lines.append(f"      options: {json.dumps(options)} as [string, string, string, string],")
        lines.append(f"      correct_answer: {json.dumps(item['correct_answer'])} as AnswerLetter,")
        lines.append(f"      explanation: {json.dumps(item['explanation'])},")
        lines.append(f"      category: {json.dumps(item['category'])} as QuizCategory,")
        lines.append("    },")
    lines.append("  ],")
lines.append("};")
lines.append("")

out = Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "quiz" / "quizPoolTopUp.ts"
out.write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {out}")
