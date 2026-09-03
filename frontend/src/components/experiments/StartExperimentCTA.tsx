import { ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface StartExperimentCTAProps {
  experimentId: string;
}

function StartExperimentCTA({ experimentId }: StartExperimentCTAProps) {
  return (
    <Card className="detail-cta-card">
      <div className="detail-cta">
        <p className="eyebrow">READY TO START?</p>
        <h2 className="detail-cta-title">Begin this experiment</h2>
        <p className="detail-cta-desc">
          Open the experiment workspace to build the circuit,
          run simulations, and validate your understanding.
        </p>
        <Button
          to={`/experiments/${experimentId}/workspace`}
          variant="primary"
          size="lg"
        >
          Start Experiment <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

export default StartExperimentCTA;
