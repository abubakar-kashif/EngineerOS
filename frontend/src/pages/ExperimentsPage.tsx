import { useMemo, useState } from "react";
import SectionHeading from "../components/ui/SectionHeading";
import ExperimentCard from "../components/experiments/ExperimentCard";
import type { Experiment, ExperimentDifficulty } from "../types/experiment";

const mockExperiments: Experiment[] = [
  {
    id: "1",
    slug: "ohms-law",
    title: "Ohm's Law",
    short_description:
      "Understand the relationship between voltage, current, and resistance.",
    description:
      "Explore Ohm's Law and learn how voltage, current, and resistance are related in an electrical circuit.",
    objective: "Understand and apply the relationship V = IR.",
    difficulty: "Beginner",
    category: "Basic Circuits",
    duration_minutes: 20,
    theory:
      "Ohm's Law states that voltage is equal to current multiplied by resistance.",
  },

  {
    id: "2",
    slug: "series-circuit",
    title: "Series Circuit",
    short_description:
      "Explore current flow and voltage distribution in series circuits.",
    description:
      "Learn how components behave when connected in series and analyze current and voltage across each component.",
    objective:
      "Understand current flow and voltage distribution in a series circuit.",
    difficulty: "Beginner",
    category: "Basic Circuits",
    duration_minutes: 25,
    theory:
      "In a series circuit, the same current flows through every component.",
  },

  {
    id: "3",
    slug: "parallel-circuit",
    title: "Parallel Circuit",
    short_description:
      "Analyze voltage and current behavior across parallel branches.",
    description:
      "Study how current divides between parallel branches while voltage remains common across each branch.",
    objective:
      "Understand current division and voltage behavior in parallel circuits.",
    difficulty: "Beginner",
    category: "Basic Circuits",
    duration_minutes: 25,
    theory:
      "In a parallel circuit, each branch has the same voltage across it.",
  },

  {
    id: "4",
    slug: "voltage-divider",
    title: "Voltage Divider",
    short_description:
      "Learn how resistors can be used to divide an input voltage.",
    description:
      "Build and analyze a voltage divider circuit using multiple resistors.",
    objective: "Calculate and understand output voltage in a resistor divider.",
    difficulty: "Beginner",
    category: "Circuit Analysis",
    duration_minutes: 25,
    theory:
      "A voltage divider distributes input voltage across series resistors.",
  },

  {
    id: "5",
    slug: "current-divider",
    title: "Current Divider",
    short_description:
      "Explore how current is distributed between parallel resistors.",
    description:
      "Analyze how current divides between branches containing different resistance values.",
    objective:
      "Understand and calculate current distribution in parallel branches.",
    difficulty: "Intermediate",
    category: "Circuit Analysis",
    duration_minutes: 30,
    theory:
      "Current division determines how total current is distributed among parallel branches.",
  },

  {
    id: "6",
    slug: "kirchhoffs-voltage-law",
    title: "Kirchhoff's Voltage Law",
    short_description:
      "Apply KVL to analyze voltage relationships around a circuit loop.",
    description:
      "Use Kirchhoff's Voltage Law to analyze voltage rises and drops around closed electrical loops.",
    objective: "Apply KVL to solve electrical circuit problems.",
    difficulty: "Intermediate",
    category: "Circuit Analysis",
    duration_minutes: 30,
    theory:
      "Kirchhoff's Voltage Law states that the algebraic sum of voltages around a closed loop is zero.",
  },

  {
    id: "7",
    slug: "kirchhoffs-current-law",
    title: "Kirchhoff's Current Law",
    short_description: "Understand how current behaves at circuit junctions.",
    description:
      "Analyze current entering and leaving circuit nodes using Kirchhoff's Current Law.",
    objective: "Apply KCL to analyze currents at circuit nodes.",
    difficulty: "Intermediate",
    category: "Circuit Analysis",
    duration_minutes: 30,
    theory:
      "Kirchhoff's Current Law states that the total current entering a node equals the total current leaving it.",
  },

  {
    id: "8",
    slug: "thevenins-theorem",
    title: "Thevenin's Theorem",
    short_description:
      "Simplify complex circuits using a Thevenin equivalent circuit.",
    description:
      "Learn how a complex linear circuit can be represented by an equivalent voltage source and resistance.",
    objective: "Find the Thevenin equivalent of a circuit.",
    difficulty: "Advanced",
    category: "Network Theorems",
    duration_minutes: 40,
    theory:
      "Thevenin's theorem represents a linear network as an equivalent voltage source and series resistance.",
  },

  {
    id: "9",
    slug: "nortons-theorem",
    title: "Norton's Theorem",
    short_description:
      "Represent complex circuits using a Norton equivalent circuit.",
    description:
      "Learn how to simplify a linear electrical network into an equivalent current source and parallel resistance.",
    objective: "Find the Norton equivalent of a circuit.",
    difficulty: "Advanced",
    category: "Network Theorems",
    duration_minutes: 40,
    theory:
      "Norton's theorem represents a linear network as an equivalent current source and parallel resistance.",
  },

  {
    id: "10",
    slug: "superposition-theorem",
    title: "Superposition Theorem",
    short_description:
      "Analyze circuits containing multiple independent sources.",
    description:
      "Use the superposition principle to determine the contribution of individual independent sources in a linear circuit.",
    objective:
      "Analyze a circuit with multiple independent sources using superposition.",
    difficulty: "Advanced",
    category: "Network Theorems",
    duration_minutes: 45,
    theory:
      "The superposition theorem allows the response of a linear circuit to be found by considering one independent source at a time.",
  },
];

function ExperimentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const [difficulty, setDifficulty] = useState<"All" | ExperimentDifficulty>(
    "All",
  );

  const [category, setCategory] = useState("All");

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(mockExperiments.map((experiment) => experiment.category)),
    );

    return ["All", ...uniqueCategories];
  }, []);

  const filteredExperiments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mockExperiments.filter((experiment) => {
      const searchableText = [
        experiment.title,
        experiment.short_description,
        experiment.description ?? "",
        experiment.category,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = query === "" || searchableText.includes(query);

      const matchesDifficulty =
        difficulty === "All" || experiment.difficulty === difficulty;

      const matchesCategory =
        category === "All" || experiment.category === category;

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [searchQuery, difficulty, category]);

return (
  <main className="min-h-screen w-full min-w-0 bg-[#f8f9fc] px-6 py-8 sm:px-8 lg:px-10 xl:px-12">
    <div className="mx-auto w-full max-w-[1280px]">
      {/* HEADER */}
      <div className="mb-6">
        <SectionHeading
          eyebrow="EXPERIMENTS"
          title="Explore electrical engineering experiments"
          description="Learn concepts by working through practical electrical engineering experiments."
        />
      </div>

      {/* FILTERS */}
      <section
        className="
          mb-6
          rounded-xl
          border border-slate-200
          bg-white
          p-4
          shadow-[0_2px_10px_rgba(15,23,42,0.04)]
        "
        aria-label="Experiment filters"
      >
        <div
          className="
            grid
            grid-cols-1
            gap-4
            lg:grid-cols-[minmax(0,1fr)_220px_220px]
          "
        >
          {/* SEARCH */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="experiment-search"
              className="text-sm font-semibold text-slate-700"
            >
              Search experiments
            </label>

            <input
              id="experiment-search"
              type="search"
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="
                w-full
                rounded-xl
                border border-slate-300
                bg-slate-50
                px-4
                py-3
                text-sm
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-violet-500
                focus:bg-white
                focus:ring-4
                focus:ring-violet-100
              "
            />
          </div>

          {/* DIFFICULTY */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="difficulty-filter"
              className="text-sm font-semibold text-slate-700"
            >
              Difficulty
            </label>

            <select
              id="difficulty-filter"
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value as "All" | ExperimentDifficulty,
                )
              }
              className="
                w-full
                rounded-xl
                border border-slate-300
                bg-slate-50
                px-4
                py-3
                text-sm
                text-slate-800
                outline-none
                transition
                focus:border-violet-500
                focus:bg-white
                focus:ring-4
                focus:ring-violet-100
              "
            >
              <option value="All">All difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* CATEGORY */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="category-filter"
              className="text-sm font-semibold text-slate-700"
            >
              Category
            </label>

            <select
              id="category-filter"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="
                w-full
                rounded-xl
                border border-slate-300
                bg-slate-50
                px-4
                py-3
                text-sm
                text-slate-800
                outline-none
                transition
                focus:border-violet-500
                focus:bg-white
                focus:ring-4
                focus:ring-violet-100
              "
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "All categories" : item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* RESULTS COUNT */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {filteredExperiments.length}
          </span>{" "}
          experiment
          {filteredExperiments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* EMPTY STATE */}
      {filteredExperiments.length === 0 && (
        <div
          className="
            flex
            min-h-[300px]
            items-center
            justify-center
            rounded-2xl
            border border-slate-200
            bg-white
            p-8
            shadow-sm
          "
        >
          <div className="text-center">
            <div
              className="
                mx-auto
                mb-4
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-violet-100
                text-xl
                text-violet-600
              "
            >
              ?
            </div>

            <h3 className="mb-2 text-lg font-bold text-slate-900">
              No experiments found
            </h3>

            <p className="text-sm text-slate-500">
              Try changing your search or filter options.
            </p>
          </div>
        </div>
      )}

      {/* EXPERIMENT CARDS */}
      {filteredExperiments.length > 0 && (
        <section
          className="
            grid
            w-full
            grid-cols-1
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
          "
          aria-label="Available electrical engineering experiments"
        >
          {filteredExperiments.map((experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
            />
          ))}
        </section>
      )}
    </div>
  </main>
);
}

export default ExperimentsPage;