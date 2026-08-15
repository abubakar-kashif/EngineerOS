import type { Experiment } from "../types/experiment";

export const mockExperiments: Experiment[] = [
  {
    id: "1",
    title: "Ohm's Law",
    slug: "ohms-law",
    short_description:
      "Understand the relationship between voltage, current, and resistance.",
    difficulty: "Beginner",
    category: "Basic Circuits",
    duration_minutes: 20,
  },
  {
    id: "2",
    title: "Series Circuit",
    slug: "series-circuit",
    short_description:
      "Explore current and voltage behavior in a series circuit.",
    difficulty: "Beginner",
    category: "Circuit Analysis",
    duration_minutes: 25,
  },
  {
    id: "3",
    title: "Parallel Circuit",
    slug: "parallel-circuit",
    short_description:
      "Analyze voltage and current distribution in parallel circuits.",
    difficulty: "Beginner",
    category: "Circuit Analysis",
    duration_minutes: 25,
  },
  {
    id: "4",
    title: "Kirchhoff's Voltage Law",
    slug: "kirchhoffs-voltage-law",
    short_description:
      "Apply KVL to analyze voltage relationships around a circuit loop.",
    difficulty: "Intermediate",
    category: "Circuit Analysis",
    duration_minutes: 30,
  },
];