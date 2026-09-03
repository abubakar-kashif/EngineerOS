import { Circle } from "lucide-react";
import Card from "../ui/Card";
import type { ExperimentComponent } from "../../types/experiment";

interface ExperimentComponentsProps {
  components: ExperimentComponent[];
}

function ExperimentComponentsList({ components }: ExperimentComponentsProps) {
  return (
    <Card className="detail-section-card">
      <div className="detail-section">
        <p className="eyebrow">REQUIRED COMPONENTS</p>
        <h2 className="detail-section-title">Equipment Needed</h2>
        <ul className="detail-components-list">
          {components.map((c) => (
            <li key={c.name}>
              <Circle size={10} className="detail-comp-dot" />
              <span className="detail-comp-name">
                {c.quantity > 1 && <span className="detail-comp-qty">{c.quantity} × </span>}
                {c.name}
              </span>
              {c.spec && <span className="detail-comp-spec">{c.spec}</span>}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default ExperimentComponentsList;
