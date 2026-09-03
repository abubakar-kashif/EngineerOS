import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../ui/Button";

type QuizNavigationProps = {
  current: number;
  total: number;
  answeredCount: number;
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

function QuizNavigation({
  current,
  total,
  answeredCount,
  submitting,
  onPrevious,
  onNext,
  onSubmit,
}: QuizNavigationProps) {
  const isLast = current === total - 1;

  return (
    <div className="quiz-nav">
      <Button
        variant="secondary"
        onClick={onPrevious}
        disabled={current === 0 || submitting}
        icon={<ChevronLeft size={15} />}
      >
        Previous
      </Button>

      <span className="quiz-nav-status" aria-live="polite">
        {answeredCount} of {total} answered
      </span>

      {isLast ? (
        <Button variant="primary" onClick={onSubmit} loading={submitting}>
          {submitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={onNext}
          disabled={submitting}
          icon={<ChevronRight size={15} />}
          iconPosition="right"
        >
          Next
        </Button>
      )}
    </div>
  );
}

export default QuizNavigation;
