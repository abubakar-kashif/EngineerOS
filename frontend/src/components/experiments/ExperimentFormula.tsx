import Card from "../ui/Card";
import type { ExperimentFormula } from "../../types/experiment";

interface ExperimentFormulaProps {
  formulas: ExperimentFormula[];
}

function ExperimentFormulaSection({ formulas }: ExperimentFormulaProps) {
  return (
    <Card className="detail-section-card">
      <div className="detail-section">
        <p className="eyebrow">FORMULA</p>
        <h2 className="detail-section-title">Key Formulas</h2>
        <div className="detail-formulas">
          {formulas.map((f, i) => (
            <div key={i} className="detail-formula-block">
              <div className="detail-formula-expression">{f.expression}</div>
              {f.variables.length > 0 && (
                <ul className="detail-formula-vars">
                  {f.variables.map((v) => (
                    <li key={v.symbol}>
                      <span className="detail-formula-symbol">{v.symbol}</span>
                      <span className="detail-formula-name">{v.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default ExperimentFormulaSection;
