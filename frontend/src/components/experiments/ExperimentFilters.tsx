import { Search, SlidersHorizontal, X } from "lucide-react";
import type { ExperimentDifficulty } from "../../types/experiment";

export type SortOption = "recommended" | "title" | "duration" | "difficulty";

interface ExperimentFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  difficulty: "All" | ExperimentDifficulty;
  onDifficultyChange: (v: "All" | ExperimentDifficulty) => void;
  status: "All" | "not_started" | "in_progress" | "completed";
  onStatusChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  resultCount: number;
}

function ExperimentFilters({
  search, onSearchChange,
  difficulty, onDifficultyChange,
  status, onStatusChange,
  sort, onSortChange,
  resultCount,
}: ExperimentFiltersProps) {
  const hasActiveFilters = difficulty !== "All" || status !== "All" || search.trim() !== "";

  function clearAll() {
    onSearchChange("");
    onDifficultyChange("All");
    onStatusChange("All");
    onSortChange("recommended");
  }

  return (
    <div className="exp-filters">
      <div className="exp-filters-row">
        <div className="exp-search">
          <Search size={16} className="exp-search-icon" />
          <input
            type="text"
            className="exp-search-input"
            placeholder="Search experiments..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search experiments"
          />
          {search && (
            <button className="exp-search-clear" onClick={() => onSearchChange("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="exp-filter-controls">
          <div className="exp-select-wrap">
            <SlidersHorizontal size={14} className="exp-select-icon" />
            <select
              className="exp-select"
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value as "All" | ExperimentDifficulty)}
              aria-label="Filter by difficulty"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="exp-select-wrap">
            <select
              className="exp-select"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="exp-select-wrap">
            <select
              className="exp-select"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort experiments"
            >
              <option value="recommended">Recommended</option>
              <option value="title">Title A-Z</option>
              <option value="duration">Duration</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>
        </div>
      </div>

      <div className="exp-filters-footer">
        <span className="exp-results-count">
          Showing <strong>{resultCount}</strong> experiment{resultCount !== 1 ? "s" : ""}
        </span>
        {hasActiveFilters && (
          <div className="exp-active-filters">
            {difficulty !== "All" && (
              <span className="exp-filter-chip">
                {difficulty}
                <button onClick={() => onDifficultyChange("All")} aria-label="Remove difficulty filter">
                  <X size={12} />
                </button>
              </span>
            )}
            {status !== "All" && (
              <span className="exp-filter-chip">
                {status.replace("_", " ")}
                <button onClick={() => onStatusChange("All")} aria-label="Remove status filter">
                  <X size={12} />
                </button>
              </span>
            )}
            <button className="exp-clear-filters" onClick={clearAll}>
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExperimentFilters;
