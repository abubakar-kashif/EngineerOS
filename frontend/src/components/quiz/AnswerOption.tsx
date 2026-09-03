import { Check, X } from "lucide-react";
import type { AnswerLetter } from "../../types/quiz";

type AnswerOptionState = "default" | "correct" | "incorrect";

type AnswerOptionProps = {
  optionKey: AnswerLetter;
  text: string;
  /** Radio group name shared by all options of one question. */
  name: string;
  selected: boolean;
  disabled?: boolean;
  /** Feedback marking — only used after submission/review. */
  state?: AnswerOptionState;
  onSelect: (key: AnswerLetter) => void;
};

function AnswerOption({
  optionKey,
  text,
  name,
  selected,
  disabled = false,
  state = "default",
  onSelect,
}: AnswerOptionProps) {
  const classes = [
    "quiz-option",
    selected ? "quiz-option--selected" : "",
    state === "correct" ? "quiz-option--correct" : "",
    state === "incorrect" ? "quiz-option--incorrect" : "",
    disabled ? "quiz-option--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classes}>
      <input
        type="radio"
        name={name}
        value={optionKey}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect(optionKey)}
        className="quiz-option-input"
      />
      <span className="quiz-option-key" aria-hidden="true">
        {optionKey}
      </span>
      <span className="quiz-option-text">{text}</span>
      {state === "correct" && (
        <span className="quiz-option-mark quiz-option-mark--correct" aria-hidden="true">
          <Check size={15} strokeWidth={3} />
        </span>
      )}
      {state === "incorrect" && (
        <span className="quiz-option-mark quiz-option-mark--incorrect" aria-hidden="true">
          <X size={15} strokeWidth={3} />
        </span>
      )}
      {state === "default" && selected && (
        <span className="quiz-option-mark quiz-option-mark--selected" aria-hidden="true">
          <Check size={15} strokeWidth={3} />
        </span>
      )}
    </label>
  );
}

export default AnswerOption;
