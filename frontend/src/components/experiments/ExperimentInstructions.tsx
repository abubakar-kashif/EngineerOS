import Card from "../ui/Card";

interface ExperimentInstructionsProps {
  procedure: string[];
}

function ExperimentInstructionsSection({ procedure }: ExperimentInstructionsProps) {
  return (
    <Card className="detail-section-card">
      <div className="detail-section">
        <p className="eyebrow">PROCEDURE</p>
        <h2 className="detail-section-title">Step-by-Step Procedure</h2>
        <ol className="detail-instructions">
          {procedure.map((step, i) => (
            <li key={i} className="detail-step">
              <span className="detail-step-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="detail-step-text">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}

export default ExperimentInstructionsSection;
