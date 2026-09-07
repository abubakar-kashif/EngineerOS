import { MessageCircle, ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface MentorCTAProps {
  experimentId?: string;
}

function MentorCTA({ experimentId }: MentorCTAProps) {
  const mentorTo = experimentId
    ? `/mentor?experiment=${encodeURIComponent(experimentId)}&stage=details`
    : "/mentor";

  return (
    <Card className="detail-cta-card detail-cta-mentor">
      <div className="detail-cta">
        <MessageCircle size={24} className="detail-cta-icon" />
        <p className="eyebrow">NEED HELP?</p>
        <h2 className="detail-cta-title">Ask AI Mentor</h2>
        <p className="detail-cta-desc">
          Get personalized guidance, hints, and explanations from your AI lab mentor.
        </p>
        <Button to={mentorTo} variant="primary" size="lg">
          Open Mentor <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

export default MentorCTA;
