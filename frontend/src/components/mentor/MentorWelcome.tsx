import { Bot, Sparkles, Zap, CircuitBoard, BarChart3, BookOpen } from "lucide-react";
import EngineerOSMark from "../branding/EngineerOSMark";
import { mentorTopics, contextPrompts } from "../../types/mentor";
import type { MentorContext } from "../../types/mentor";

interface MentorWelcomeProps {
  context: MentorContext;
  experimentTitle: string | null;
  suggestedPrompts: string[];
  onPromptSelect: (prompt: string) => void;
  onTopicSelect: (topic: string) => void;
}

const categoryIcons: Record<string, typeof Zap> = {
  circuit: CircuitBoard,
  simulation: Zap,
  component: Sparkles,
  theory: BookOpen,
  measurement: BarChart3,
};

function MentorWelcome({
  context,
  experimentTitle,
  suggestedPrompts,
  onPromptSelect,
  onTopicSelect,
}: MentorWelcomeProps) {
  // Determine which context categories are relevant
  const activeCategories: string[] = [];
  if (context.circuit) activeCategories.push("circuit");
  if (context.simulationStatus !== "idle") activeCategories.push("simulation");
  if (context.measurements) activeCategories.push("measurement");
  if (context.quizQuestion) activeCategories.push("quiz");
  activeCategories.push("theory"); // always relevant
  if (context.circuit && context.circuit.componentCount > 0) activeCategories.push("component");

  return (
    <div className="mentor-welcome">
      <div className="mentor-welcome-hero">
        <EngineerOSMark size="md" />
        <div>
          <h1 className="mentor-welcome-title">AI Mentor</h1>
          <p className="mentor-welcome-subtitle">
            {experimentTitle
              ? `Your engineering assistant — currently on ${experimentTitle}`
              : "Your engineering assistant — understands experiments, circuits, simulations, and measurements"}
          </p>
        </div>
      </div>

      <p className="mentor-welcome-question">
        {experimentTitle
          ? `What do you want to know about ${experimentTitle}?`
          : "What are you working on?"}
      </p>

      {/* Context-aware prompt categories */}
      {activeCategories.length > 1 && (
        <div className="mentor-welcome-context-prompts">
          {activeCategories.map((cat) => {
            const Icon = categoryIcons[cat] ?? Sparkles;
            const prompts = contextPrompts[cat];
            if (!prompts) return null;
            return (
              <div key={cat} className="mentor-context-prompt-group">
                <span className="mentor-context-prompt-label">
                  <Icon size={12} />
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
                <div className="mentor-context-prompt-chips">
                  {prompts.slice(0, 2).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="mentor-prompt-card"
                      onClick={() => onPromptSelect(p)}
                    >
                      <Bot size={13} />
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Topic chips */}
      <div className="mentor-welcome-topics" role="group" aria-label="Ask about a topic">
        {mentorTopics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className="mentor-topic-chip"
            onClick={() => onTopicSelect(topic.label)}
          >
            <Sparkles size={12} />
            {topic.label}
          </button>
        ))}
      </div>

      {/* Experiment-scoped prompts */}
      {experimentTitle && (
        <div className="mentor-welcome-prompts">
          <p className="mentor-welcome-prompts-label">Suggested:</p>
          <div className="mentor-welcome-prompt-list">
            {suggestedPrompts.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="mentor-prompt-card"
                onClick={() => onPromptSelect(prompt)}
              >
                <Bot size={13} />
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mentor-welcome-note">
        Responses are produced by a placeholder responder while the AI engine is being
        connected — simulated replies are always labeled.
      </p>
    </div>
  );
}

export default MentorWelcome;
