"""Write the frontend mirror of quiz_band_fill.py."""
import json
from pathlib import Path

from app.data.quiz_band_fill import BAND_FILL

lines = [
    'import type { AnswerLetter, QuizCategory } from "../../types/quiz";',
    'import type { SeedQuizQuestion } from "./quizBank";',
    "",
    "/** Mirrored from backend/app/data/quiz_band_fill.py. */",
    "export const QUIZ_BAND_FILL: Record<string, SeedQuizQuestion[]> = {",
]
for experiment_id, items in BAND_FILL.items():
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

out = Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "quiz" / "quizBandFill.ts"
out.write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size} bytes)")
