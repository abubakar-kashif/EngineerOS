import { BrainCircuit, ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface QuizCTAProps {
  experimentId: string;
}

function QuizCTA({ experimentId }: QuizCTAProps) {
  return (
    <Card className="detail-cta-card detail-cta-quiz">
      <div className="detail-cta">
        <BrainCircuit size={24} className="detail-cta-icon" />
        <p className="eyebrow">TEST YOUR KNOWLEDGE</p>
        <h2 className="detail-cta-title">Take the Quiz</h2>
        <p className="detail-cta-desc">
          Answer questions to verify your understanding of this experiment's concepts.
        </p>
        <Button to={`/quiz/${experimentId}`} variant="primary" size="lg">
          Start Quiz <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

export default QuizCTA;
