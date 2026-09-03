import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SectionHeading from "../components/ui/SectionHeading";
import ExperimentCard from "../components/experiments/ExperimentCard";
import ExperimentFilters, { type SortOption } from "../components/experiments/ExperimentFilters";
import ExperimentSkeleton from "../components/experiments/ExperimentSkeleton";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import type { Experiment, ExperimentDifficulty } from "../types/experiment";
import { mockExperiments } from "../data/mockExperiments";
import { getExperiments } from "../services/experimentService";
import { getStatusMap } from "../services/progressService";
import { getAuthToken } from "../services/api";
import { getAllProgress, type UserProgress } from "../utils/experimentProgress";

const DIFFICULTY_ORDER: Record<string, number> = { Beginner: 0, Intermediate: 1, Advanced: 2 };

function ExperimentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // URL-synced filter state
  const search = searchParams.get("q") ?? "";
  const difficulty = (searchParams.get("difficulty") ?? "All") as "All" | ExperimentDifficulty;
  const status = (searchParams.get("status") ?? "All") as "All" | "not_started" | "in_progress" | "completed";
  const sort = (searchParams.get("sort") ?? "recommended") as SortOption;

  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === "All" || value === "recommended") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    }, { replace: true });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const response = await getExperiments();
        if (cancelled) return;
        setExperiments(response.items.length > 0 ? response.items : mockExperiments);
      } catch {
        if (cancelled) return;
        setExperiments(mockExperiments);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Statuses are account-scoped: the signed-in user's server rows, or this
  // device's local tracking for anonymous visitors.
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>(() =>
    getAuthToken() ? {} : getAllProgress(),
  );

  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    getStatusMap()
      .then((map) => {
        if (!cancelled) setProgressMap(map);
      })
      .catch(() => {
        // Backend unavailable — statuses stay "not started" instead of
        // showing another session's local history.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = experiments.filter((exp) => {
      // Text search
      if (q) {
        const haystack = [exp.title, exp.short_description ?? "", exp.description ?? "", exp.category, exp.id].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Difficulty filter
      if (difficulty !== "All" && exp.difficulty !== difficulty) return false;

      // Status filter
      if (status !== "All") {
        const expStatus = progressMap[exp.id] ?? "not_started";
        if (expStatus !== status) return false;
      }

      return true;
    });

    // Sort
    switch (sort) {
      case "title":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "duration":
        result = [...result].sort((a, b) => a.duration_minutes - b.duration_minutes);
        break;
      case "difficulty":
        result = [...result].sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 9) - (DIFFICULTY_ORDER[b.difficulty] ?? 9));
        break;
      default:
        // recommended — keep original order (beginner first from data)
        break;
    }

    return result;
  }, [experiments, search, difficulty, status, sort, progressMap]);

  return (
    <div className="page">
      <SectionHeading
        eyebrow="EXPERIMENTS"
        title="Explore engineering experiments"
        description="Search, filter, and discover practical experiments to build your understanding step by step."
      />

      <ExperimentFilters
        search={search}
        onSearchChange={(v) => updateParam("q", v)}
        difficulty={difficulty}
        onDifficultyChange={(v) => updateParam("difficulty", v)}
        status={status}
        onStatusChange={(v) => updateParam("status", v)}
        sort={sort}
        onSortChange={(v) => updateParam("sort", v)}
        resultCount={filtered.length}
      />

      {loading && (
        <div className="exp-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <ExperimentSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="exp-error-state">
          <h3>Unable to load experiments</h3>
          <p>Something went wrong while loading the experiment library.</p>
          <div className="exp-error-action">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="exp-empty-state">
          <h3>No experiments found</h3>
          <p>We couldn&apos;t find an experiment matching your current search and filters.</p>
          <div className="exp-empty-action">
            <Button variant="secondary" onClick={() => setSearchParams({})}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="exp-grid">
          {filtered.map((exp) => (
            <ExperimentCard
              key={exp.id}
              experiment={exp}
              progress={progressMap[exp.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ExperimentsPage;
