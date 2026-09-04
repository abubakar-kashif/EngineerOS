import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SectionHeading from "../../components/ui/SectionHeading";
import {
  appendCalculatorToken,
  evaluateExpression,
  formatResult,
  type AngleMode,
} from "../../services/tools/toolsService";

type KeyDef = {
  label: string;
  /** Value appended to the expression (display form). */
  value: string;
  kind: "num" | "op" | "fn" | "action";
  ariaLabel?: string;
};

const KEYPAD: KeyDef[] = [
  { label: "C", value: "C", kind: "action", ariaLabel: "Clear" },
  { label: "(", value: "(", kind: "num" },
  { label: ")", value: ")", kind: "num" },
  { label: "⌫", value: "backspace", kind: "action", ariaLabel: "Backspace" },
  { label: "7", value: "7", kind: "num" },
  { label: "8", value: "8", kind: "num" },
  { label: "9", value: "9", kind: "num" },
  { label: "÷", value: "÷", kind: "op", ariaLabel: "Divide" },
  { label: "4", value: "4", kind: "num" },
  { label: "5", value: "5", kind: "num" },
  { label: "6", value: "6", kind: "num" },
  { label: "×", value: "×", kind: "op", ariaLabel: "Multiply" },
  { label: "1", value: "1", kind: "num" },
  { label: "2", value: "2", kind: "num" },
  { label: "3", value: "3", kind: "num" },
  { label: "−", value: "−", kind: "op", ariaLabel: "Subtract" },
  { label: "0", value: "0", kind: "num" },
  { label: ".", value: ".", kind: "num" },
  { label: "^", value: "^", kind: "op", ariaLabel: "Power" },
  { label: "+", value: "+", kind: "op", ariaLabel: "Add" },
];

const SCIENTIFIC: KeyDef[] = [
  { label: "sin", value: "sin(", kind: "fn" },
  { label: "cos", value: "cos(", kind: "fn" },
  { label: "tan", value: "tan(", kind: "fn" },
  { label: "√", value: "√(", kind: "fn", ariaLabel: "Square root" },
  { label: "|x|", value: "abs(", kind: "fn", ariaLabel: "Absolute value" },
  { label: "log", value: "log(", kind: "fn" },
  { label: "ln", value: "ln(", kind: "fn" },
  { label: "π", value: "π", kind: "fn", ariaLabel: "Pi" },
  { label: "e", value: "e", kind: "fn", ariaLabel: "Euler's number" },
  { label: "x²", value: "^2", kind: "fn", ariaLabel: "Square" },
];

const OPERATORS = ["+", "−", "×", "÷", "^"];

function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [lastValue, setLastValue] = useState<number | null>(null);
  const [mode, setMode] = useState<AngleMode>("deg");

  /** Live preview of the expression, when it can be evaluated. */
  const preview = (() => {
    if (error || justEvaluated || display === "0" || display === "") return null;
    try {
      return formatResult(evaluateExpression(display, mode));
    } catch {
      return null;
    }
  })();

  const appendToken = useCallback((token: string) => {
    setError(null);

    // After "=", digits start fresh while operators keep the answer.
    let base = display;
    if (justEvaluated) {
      const isOperator = OPERATORS.includes(token);
      base = isOperator
        ? lastValue !== null && Number.isFinite(lastValue)
          ? String(lastValue)
          : display
        : "";
      setJustEvaluated(false);
    }

    setDisplay(appendCalculatorToken(base, token));
  }, [display, justEvaluated, lastValue]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setError(null);
    setJustEvaluated(false);
    setLastValue(null);
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    setJustEvaluated(false);
    setDisplay((current) => {
      if (current.length <= 1) return "0";
      return current.slice(0, -1);
    });
  }, []);

  const handleEquals = useCallback(() => {
    if (justEvaluated) return;
    try {
      const value = evaluateExpression(display, mode);
      setLastValue(value);
      setError(null);
      setDisplay(formatResult(value));
      setJustEvaluated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid expression");
    }
  }, [display, justEvaluated, mode]);

  const pressKey = useCallback(
    (key: KeyDef) => {
      if (key.value === "C") {
        clearAll();
      } else if (key.value === "backspace") {
        backspace();
      } else if (key.value === "=") {
        handleEquals();
      } else {
        appendToken(key.value);
      }
    },
    [appendToken, backspace, clearAll, handleEquals],
  );

  // Keyboard support: digits, operators, Enter, Backspace, Escape.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const { key } = event;

      if (/^[0-9.]$/.test(key)) {
        pressKey({ label: key, value: key, kind: "num" });
      } else if (["+", "-", "*", "/", "^", "(", ")"].includes(key)) {
        const displayKey = key === "*" ? "×" : key === "/" ? "÷" : key === "-" ? "−" : key;
        pressKey({ label: displayKey, value: displayKey, kind: "op" });
      } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        handleEquals();
      } else if (key === "Backspace") {
        event.preventDefault();
        backspace();
      } else if (key === "Escape") {
        clearAll();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [backspace, clearAll, handleEquals, pressKey]);

  return (
    <main className="page calc-page">
      <SectionHeading
        eyebrow="TOOLBOX"
        title="Scientific Calculator"
        description="Basic arithmetic plus trig, roots, logs and powers. Press a function, enter the value, then = (closing ) is optional). Enter evaluates, Escape clears."
      />

      <div className="calc-shell">
        <div className="calc-display" aria-live="polite">
          <span className={`calc-expression${error ? " calc-expression-error" : ""}`}>
            {error ?? display}
          </span>
          {preview !== null && <span className="calc-preview">= {preview}</span>}
        </div>

        <div className="calc-mode-row">
          <button
            type="button"
            className={`calc-mode-toggle${mode === "deg" ? " calc-mode-toggle-active" : ""}`}
            onClick={() => setMode("deg")}
            aria-pressed={mode === "deg"}
          >
            DEG
          </button>
          <button
            type="button"
            className={`calc-mode-toggle${mode === "rad" ? " calc-mode-toggle-active" : ""}`}
            onClick={() => setMode("rad")}
            aria-pressed={mode === "rad"}
          >
            RAD
          </button>
          <span className="calc-mode-hint">
            {mode === "deg" ? "Trig uses degrees" : "Trig uses radians"}
          </span>
        </div>

        <div className="calc-scientific">
          {SCIENTIFIC.map((key) => (
            <button
              key={key.label}
              type="button"
              className="calc-key calc-key-fn"
              onClick={() => pressKey(key)}
              aria-label={key.ariaLabel ?? key.label}
            >
              {key.label}
            </button>
          ))}
        </div>

        <div className="calc-keypad">
          {KEYPAD.map((key) => (
            <button
              key={key.label}
              type="button"
              className={`calc-key calc-key-${key.kind}`}
              onClick={() => pressKey(key)}
              aria-label={key.ariaLabel ?? key.label}
            >
              {key.label}
            </button>
          ))}
          <button
            type="button"
            className="calc-key calc-key-equals"
            onClick={handleEquals}
            aria-label="Equals"
          >
            =
          </button>
        </div>
      </div>

      <p className="tools-back-note">
        <Link to="/tools" className="tools-back-link">
          <ArrowLeft size={13} /> All tools
        </Link>
      </p>
    </main>
  );
}

export default CalculatorPage;
