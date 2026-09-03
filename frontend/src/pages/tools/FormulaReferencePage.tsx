import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import FormulaCard from "../../components/tools/FormulaCard";
import SectionHeading from "../../components/ui/SectionHeading";
import { searchFormulas } from "../../services/tools/toolsService";
import { FORMULA_CATEGORIES, type FormulaCategory } from "../../types/tools";

function FormulaReferencePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FormulaCategory | "all">("all");

  const results = useMemo(() => searchFormulas(query, category), [query, category]);

  return (
    <main className="page formula-page">
      <SectionHeading
        eyebrow="TOOLBOX"
        title="Formula Reference"
        description="The electrical engineering formulas you reach for most, with plain-language variable legends."
      />

      <div className="formula-controls">
        <div className="formula-search">
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search formulas, variables or topics…"
            aria-label="Search formulas"
          />
          {query && (
            <button
              type="button"
              className="formula-search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        <div className="formula-filters" role="group" aria-label="Filter by topic">
          <button
            type="button"
            className={`formula-filter-pill${category === "all" ? " formula-filter-pill-active" : ""}`}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            All
          </button>
          {FORMULA_CATEGORIES.map((entry) => (
            <button
              key={entry}
              type="button"
              className={`formula-filter-pill${category === entry ? " formula-filter-pill-active" : ""}`}
              aria-pressed={category === entry}
              onClick={() => setCategory(entry)}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="state-container">
          <p className="state-title">No formulas match "{query}"</p>
          <p className="state-description">
            Try a different term, or clear the filters to browse the full library.
          </p>
        </div>
      ) : (
        <div className="formula-grid">
          {results.map((formula) => (
            <FormulaCard key={formula.id} formula={formula} />
          ))}
        </div>
      )}

      <p className="tools-back-note">
        <Link to="/tools" className="tools-back-link">
          <ArrowLeft size={13} /> All tools
        </Link>
      </p>
    </main>
  );
}

export default FormulaReferencePage;
