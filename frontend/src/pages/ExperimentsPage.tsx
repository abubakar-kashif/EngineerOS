import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Beaker } from "lucide-react";
import SectionHeading from "../components/ui/SectionHeading";
import ExperimentCard from "../components/experiments/ExperimentCard";
import ExperimentFilters, { type SortOption } from "../components/experiments/ExperimentFilters";
import ExperimentSkeleton from "../components/experiments/ExperimentSkeleton";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import type { Experiment, ExperimentDifficulty } from "../types/experiment";
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
  const [reloadKey, setReloadKey] = useState(0);

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
        setExperiments(response.items);
      } catch {
        if (cancelled) return;
        setExperiments([]);
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = experiments.filter((exp) => {
      if (q) {
        const haystack = [exp.title, exp.short_description ?? "", exp.description ?? "", exp.category, exp.id].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (difficulty !== "All" && exp.difficulty !== difficulty) return false;
      if (status !== "All") {
        const expStatus = progressMap[exp.id] ?? "not_started";
        if (expStatus !== status) return false;
      }
      return true;
    });

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
        break;
    }

    return result;
  }, [experiments, search, difficulty, status, sort, progressMap]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

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
        <ErrorState
          title="Unable to load experiments"
          description="Something went wrong while loading the experiment library."
          retryAction={reload}
        />
      )}

      {!loading && !error && experiments.length === 0 && (
        <EmptyState
          icon={<Beaker size={28} />}
          title="No experiments yet"
          description="The experiment catalog is empty. Check back after the library is seeded."
        />
      )}

      {!loading && !error && experiments.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={<Beaker size={28} />}
          title="No experiments found"
          description="We couldn't find an experiment matching your current search and filters."
          action={
            <Button variant="secondary" onClick={() => setSearchParams({})}>
              Clear Filters
            </Button>
          }
        />
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
