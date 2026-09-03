import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "../ui/useToast";
import type { Formula } from "../../types/tools";

type FormulaCardProps = {
  formula: Formula;
};

/** Reference card: expression, "where" legend and a copy button. */
function FormulaCard({ formula }: FormulaCardProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyFormula() {
    try {
      await navigator.clipboard.writeText(formula.expression);
      setCopied(true);
      toast.success("Formula copied", `${formula.name} is ready to paste.`);
    } catch {
      toast.error("Copy failed", "Your browser blocked clipboard access.");
    }
  }

  return (
    <article className="formula-card">
      <div className="formula-card-head">
        <h3 className="formula-card-name">{formula.name}</h3>
        <span className="formula-card-category">{formula.category}</span>
      </div>

      <p className="formula-card-expression">{formula.expression}</p>

      {formula.variables.length > 0 && (
        <div className="formula-card-variables">
          <span className="formula-card-where">Where</span>
          <ul className="formula-card-variable-list">
            {formula.variables.map((variable) => (
              <li key={variable.symbol} className="formula-card-variable">
                <code>{variable.symbol}</code>
                <span>{variable.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="formula-card-copy"
        onClick={() => void copyFormula()}
        aria-label={`Copy ${formula.name} formula`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy Formula"}
      </button>
    </article>
  );
}

export default FormulaCard;
