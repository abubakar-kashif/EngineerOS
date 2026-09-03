/**
 * Mentor-specific context and UI helpers.
 *
 * The AI Mentor should understand experiment, theory, circuit,
 * measurement, simulation result, quiz question, and user's question.
 */

/** Simulation lifecycle state visible to the mentor. */
export type SimulationStatus = "idle" | "building" | "running" | "completed" | "failed";

/** Compact measurement snapshot for mentor context. */
export interface MentorMeasurements {
  totalVoltage?: string;
  totalCurrent?: string;
  totalPower?: string;
  componentCount?: number;
}

/** Compact circuit summary for mentor context. */
export interface MentorCircuitInfo {
  componentCount: number;
  wireCount: number;
  hasGround: boolean;
  hasSource: boolean;
  validationErrors: number;
}

export interface MentorContext {
  /** Experiment the user came from, if any. */
  experimentId: string | null;
  experimentTitle: string | null;
  difficulty: string | null;
  /** Where in the learning flow the user is (details / workspace / …). */
  stage: string | null;
  /** Current simulation lifecycle status. */
  simulationStatus: SimulationStatus;
  /** Compact circuit summary from the simulation canvas. */
  circuit: MentorCircuitInfo | null;
  /** Latest measurement snapshot. */
  measurements: MentorMeasurements | null;
  /** Current quiz question text, if the user is in quiz mode. */
  quizQuestion: string | null;
}

export const emptyMentorContext: MentorContext = {
  experimentId: null,
  experimentTitle: null,
  difficulty: null,
  stage: null,
  simulationStatus: "idle",
  circuit: null,
  measurements: null,
  quizQuestion: null,
};

/** Engineering topics supported by EngineerOS, used for suggested prompts. */
export interface MentorTopic {
  id: string;
  label: string;
  prompts: string[];
}

export const mentorTopics: MentorTopic[] = [
  {
    id: "circuits",
    label: "Circuits",
    prompts: [
      "Why is current the same everywhere in a series circuit?",
      "Explain the equation V = IR.",
      "What happens if resistance increases?",
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    prompts: [
      "What does a capacitor do in a DC circuit?",
      "How does a diode allow current in only one direction?",
      "Explain RC circuit charging behavior.",
    ],
  },
  {
    id: "power",
    label: "Power Systems",
    prompts: [
      "What is the difference between real and apparent power?",
      "Why do transformers have losses?",
      "Explain the power triangle.",
    ],
  },
  {
    id: "control",
    label: "Control Systems",
    prompts: [
      "What is the difference between open-loop and closed-loop control?",
      "Explain PID control in simple terms.",
      "What does system stability mean?",
    ],
  },
  {
    id: "signals",
    label: "Signals",
    prompts: [
      "What is the difference between AC and DC signals?",
      "Explain the time constant τ = RC.",
      "What is signal frequency measured in?",
    ],
  },
];

/**
 * Phase 11 context-aware suggested actions.
 *
 * "Explain this circuit", "Why is my current wrong?",
 * "What did I do incorrectly?", "Explain this formula",
 * "Why is the LED off?", "Help me understand my result"
 */
export const contextPrompts: Record<string, string[]> = {
  circuit: [
    "Explain this circuit",
    "What does each component do here?",
    "How does current flow in this circuit?",
  ],
  simulation: [
    "Why is my current wrong?",
    "Help me understand my result",
    "What did I do incorrectly?",
    "Why are the values different from expected?",
  ],
  component: [
    "Why is the LED off?",
    "What happens if I increase the resistance?",
    "Explain how a diode works in this circuit",
  ],
  theory: [
    "Explain this formula",
    "Derive the key equation step by step",
    "What is the theory behind this experiment?",
  ],
  measurement: [
    "Why is the voltage lower than expected?",
    "What do my measurements tell me?",
    "How do I validate these results?",
  ],
  quiz: [
    "Help me understand this quiz question",
    "Explain why my answer was wrong",
    "Give me a hint without the answer",
  ],
};

/** General welcome prompts when there is no experiment context. */
export const welcomePrompts: string[] = [
  "Explain this experiment to me",
  "Help me understand the theory",
  "Check my reasoning",
  "What should I measure first?",
];

/** Experiment-scoped prompt suggestions. */
export function experimentPrompts(experimentTitle: string | null): string[] {
  if (!experimentTitle) return welcomePrompts;
  return [
    `Why does ${experimentTitle} matter in real circuits?`,
    "What should I measure first?",
    "Explain this circuit",
    "Help me understand my result",
    "Why is the LED off?",
    "What did I do incorrectly?",
    "Explain the key equation step by step",
  ];
}

/** Client-side conversation title derivation (not AI-generated). */
export function deriveTitleFromMessage(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean.length <= 42) return clean;
  return `${clean.slice(0, 42).trimEnd()}…`;
}
