import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import type { Experiment } from "../../types/experiment";

interface HomeSearchProps {
  experiments: Experiment[];
}

function HomeSearch({ experiments }: HomeSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length > 0
    ? experiments.filter(
        (e) =>
          e.title.toLowerCase().includes(query.toLowerCase()) ||
          e.short_description?.toLowerCase().includes(query.toLowerCase()) ||
          e.category.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const showResults = isFocused && query.trim().length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: string) {
    setQuery("");
    setIsFocused(false);
    navigate(`/experiments/${id}`);
  }

  function handleClear() {
    setQuery("");
    setIsFocused(false);
  }

  const suggestions = query.trim().length === 0
    ? experiments.slice(0, 5)
    : [];

  return (
    <section className="home-search" ref={containerRef}>
      <div className="home-search-inner">
        <div className="home-search-input-wrap">
          <Search size={18} className="home-search-icon" />
          <input
            type="text"
            className="home-search-input"
            placeholder="Search experiments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            aria-label="Search experiments"
          />
          {query && (
            <button
              className="home-search-clear"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {showResults && (
          <div className="home-search-dropdown">
            {filtered.length > 0 ? (
              <ul className="home-search-results">
                {filtered.map((exp) => (
                  <li key={exp.id}>
                    <button
                      className="home-search-result"
                      onClick={() => handleSelect(exp.id)}
                    >
                      <span className="home-search-result-title">{exp.title}</span>
                      <span className="home-search-result-meta">
                        {exp.category} · {exp.difficulty} · {exp.duration_minutes} min
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="home-search-empty">
                <p>No matching experiments</p>
                <p className="home-search-empty-hint">
                  Try: &quot;Ohm&quot;, &quot;circuit&quot;, &quot;voltage&quot;, &quot;current&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {!showResults && isFocused && suggestions.length > 0 && (
          <div className="home-search-dropdown">
            <p className="home-search-suggestions-label">Suggested experiments</p>
            <ul className="home-search-results">
              {suggestions.map((exp) => (
                <li key={exp.id}>
                  <button
                    className="home-search-result"
                    onClick={() => handleSelect(exp.id)}
                  >
                    <span className="home-search-result-title">{exp.title}</span>
                    <span className="home-search-result-meta">
                      {exp.category} · {exp.difficulty}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomeSearch;
