import { useEffect, useMemo, useState } from "react";
import SectionHeading from "../components/ui/SectionHeading";
import ExperimentCard from "../components/experiments/ExperimentCard";
import type { Experiment, ExperimentDifficulty } from "../types/experiment";
import { mockExperiments } from "../data/mockExperiments";
import { getExperiments } from "../services/experimentService";

function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>(mockExperiments);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [difficulty, setDifficulty] = useState<"All" | ExperimentDifficulty>(
    "All",
  );

  const [category, setCategory] = useState("All");
  useEffect(() => {
    async function loadExperiments() {
      try {
        setLoading(true);

        const response = await getExperiments();

        setExperiments(response.items);
      } catch (error) {
        console.error("Failed to load experiments:", error);
        setExperiments(mockExperiments);
      } finally {
        setLoading(false);
      }
    }

    loadExperiments();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(experiments.map((experiment) => experiment.category)),
    );

    return ["All", ...uniqueCategories];
  }, [experiments]);

  const filteredExperiments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return experiments.filter((experiment) => {
      const searchableText = [
        experiment.id,
        experiment.slug,
        experiment.title,
        experiment.short_description ?? "",
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
  }, [experiments, searchQuery, difficulty, category]);

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
        {loading && (
          <div className="mb-4 text-sm font-medium text-slate-500">
            Loading experiments...
          </div>
        )}

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
              <ExperimentCard key={experiment.id} experiment={experiment} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

export default ExperimentsPage;
