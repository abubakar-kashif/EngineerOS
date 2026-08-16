import type { Experiment } from "../types/experiment";

export const mockExperiments: Experiment[] = [
  {
    id: "ohms-law",
    title: "Ohm's Law",
    slug: "ohms-law",
    short_description:
      "Understand the relationship between voltage, current, and resistance.",
    description:
      "Explore the relationship between voltage, current, and resistance using Ohm's Law.",
    objective:
      "Understand how voltage, current, and resistance are related in a basic electrical circuit.",
    theory:
      "Ohm's Law states that voltage is equal to current multiplied by resistance: V = I × R.",
    components: [
      "DC Voltage Source",
      "Resistor",
      "Ammeter",
      "Voltmeter",
    ],
    difficulty: "Beginner",
    category: "Circuit Fundamentals",
    duration_minutes: 30,
  },

  {
    id: "series-circuit",
    title: "Series Circuit",
    slug: "series-circuit",
    short_description:
      "Explore current and voltage behavior in a series circuit.",
    description:
      "Study how current and voltage behave when electrical components are connected in series.",
    objective:
      "Understand current flow and voltage distribution in a series circuit.",
    theory:
      "In a series circuit, the same current flows through every component while the supply voltage is divided across components.",
    components: [
      "DC Voltage Source",
      "Resistor",
      "Ammeter",
      "Voltmeter",
    ],
    difficulty: "Beginner",
    category: "Circuit Analysis",
    duration_minutes: 30,
  },

  {
    id: "parallel-circuit",
    title: "Parallel Circuit",
    slug: "parallel-circuit",
    short_description:
      "Analyze voltage and current distribution in parallel circuits.",
    description:
      "Explore voltage and current behavior across multiple parallel branches.",
    objective:
      "Understand how current divides and how voltage behaves across parallel branches.",
    theory:
      "In a parallel circuit, each branch has the same voltage while the total current is divided between branches.",
    components: [
      "DC Voltage Source",
      "Resistors",
      "Ammeter",
      "Voltmeter",
    ],
    difficulty: "Beginner",
    category: "Circuit Analysis",
    duration_minutes: 30,
  },

  {
    id: "kvl",
    title: "Kirchhoff's Voltage Law",
    slug: "kvl",
    short_description:
      "Apply KVL to analyze voltage relationships around a circuit loop.",
    description:
      "Learn how Kirchhoff's Voltage Law can be used to analyze voltage around a closed circuit loop.",
    objective:
      "Verify that the algebraic sum of voltages around a closed loop is zero.",
    theory:
      "Kirchhoff's Voltage Law states that the algebraic sum of all voltage rises and drops around a closed loop is zero.",
    components: [
      "DC Voltage Source",
      "Resistors",
      "Voltmeter",
    ],
    difficulty: "Intermediate",
    category: "Circuit Analysis",
    duration_minutes: 30,
  },

  {
    id: "kcl",
    title: "Kirchhoff's Current Law",
    slug: "kcl",
    short_description:
      "Analyze current entering and leaving a circuit node.",
    description:
      "Study current relationships at circuit nodes using Kirchhoff's Current Law.",
    objective:
      "Verify that the total current entering a node equals the total current leaving it.",
    theory:
      "Kirchhoff's Current Law states that the algebraic sum of currents at a circuit node is zero.",
    components: [
      "DC Voltage Source",
      "Resistors",
      "Ammeter",
    ],
    difficulty: "Intermediate",
    category: "Circuit Analysis",
    duration_minutes: 30,
  },

  {
    id: "voltage-divider",
    title: "Voltage Divider",
    slug: "voltage-divider",
    short_description:
      "Learn how voltage is distributed across series resistors.",
    description:
      "Explore how a pair of resistors can be used to produce a fraction of an input voltage.",
    objective:
      "Understand and calculate output voltage using a voltage divider.",
    theory:
      "A voltage divider produces an output voltage determined by the ratio of resistor values in a series network.",
    components: [
      "DC Voltage Source",
      "Two Resistors",
      "Voltmeter",
    ],
    difficulty: "Beginner",
    category: "Circuit Fundamentals",
    duration_minutes: 25,
  },

  {
    id: "current-divider",
    title: "Current Divider",
    slug: "current-divider",
    short_description:
      "Understand how current divides between parallel branches.",
    description:
      "Explore how total current is distributed across parallel resistive branches.",
    objective:
      "Calculate branch currents in a parallel resistor network.",
    theory:
      "A current divider distributes total current among parallel branches according to their resistance values.",
    components: [
      "DC Current Source",
      "Resistors",
      "Ammeter",
    ],
    difficulty: "Intermediate",
    category: "Circuit Fundamentals",
    duration_minutes: 25,
  },

  {
    id: "rc-circuit",
    title: "RC Circuit",
    slug: "rc-circuit",
    short_description:
      "Explore charging and discharging behavior in an RC circuit.",
    description:
      "Study the transient response of a resistor-capacitor circuit.",
    objective:
      "Understand the charging and discharging behavior of a capacitor through a resistor.",
    theory:
      "The capacitor voltage in an RC circuit changes exponentially according to the circuit time constant.",
    components: [
      "DC Voltage Source",
      "Resistor",
      "Capacitor",
      "Voltmeter",
    ],
    difficulty: "Intermediate",
    category: "Circuit Analysis",
    duration_minutes: 35,
  },

  {
    id: "diode-characteristics",
    title: "Diode Characteristics",
    slug: "diode-characteristics",
    short_description:
      "Explore the voltage-current characteristics of a diode.",
    description:
      "Study how current changes with voltage across a semiconductor diode.",
    objective:
      "Understand forward and reverse bias behavior of a diode.",
    theory:
      "A diode allows current to flow primarily in one direction and exhibits a nonlinear current-voltage relationship.",
    components: [
      "DC Voltage Source",
      "Resistor",
      "Diode",
      "Ammeter",
      "Voltmeter",
    ],
    difficulty: "Intermediate",
    category: "Electronics",
    duration_minutes: 35,
  },

  {
    id: "led-circuit",
    title: "LED Circuit",
    slug: "led-circuit",
    short_description:
      "Build a simple LED circuit and understand current limiting.",
    description:
      "Learn how to safely operate an LED using a current-limiting resistor.",
    objective:
      "Understand LED operation and the purpose of a series resistor.",
    theory:
      "An LED emits light when forward biased, while a series resistor limits current and protects the device.",
    components: [
      "DC Voltage Source",
      "LED",
      "Resistor",
      "Ammeter",
    ],
    difficulty: "Beginner",
    category: "Electronics",
    duration_minutes: 25,
  },
];