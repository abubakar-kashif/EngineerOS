import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { CALCULATORS, formatResult } from "../../data/engineeringCalculators";
import type { CalculatorDef } from "../../data/engineeringCalculators";

/** Unique category list, in the order categories first appear in CALCULATORS. */
function getCategories(): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];
  for (const calc of CALCULATORS) {
    if (!seen.has(calc.category)) {
      seen.add(calc.category);
      categories.push(calc.category);
    }
  }
  return categories;
}

function EngineeringCalculatorsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selected, setSelected] = useState<CalculatorDef | null>(null);

const categories = useMemo(() => getCategories(), []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return CALCULATORS.filter((calc) => {
      if (activeCategory !== "all" && calc.category !== activeCategory) return false;
      if (!term) return true;
      return (
        calc.name.toLowerCase().includes(term) ||
        calc.formula.toLowerCase().includes(term) ||
        calc.category.toLowerCase().includes(term)
      );
    });
  }, [search, activeCategory]);

  if (selected) {
    return <CalculatorDetail calculator={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="page formula-page">
      <div className="tools-back-note">
        <Link to="/tools" className="tools-back-link">
          <ArrowLeft size={14} /> All Tools
        </Link>
      </div>

      <div className="section-heading">
        <p className="eyebrow">Tools</p>
        <h2>Engineering Calculators</h2>
        <p>
          Solve for any variable — not just plug-and-chug. Pick a calculator, choose what
          you&apos;re solving for, and fill in the rest.
        </p>
      </div>

      <div className="formula-controls">
        <label className="formula-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search calculators…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="formula-search-clear" onClick={() => setSearch("")}>
              Clear
            </button>
          )}
        </label>

        <div className="formula-filters">
          <button
            type="button"
            className={`formula-filter-pill ${activeCategory === "all" ? "formula-filter-pill-active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`formula-filter-pill ${activeCategory === cat ? "formula-filter-pill-active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="exp-empty-state">
          <h3>No calculators found</h3>
          <p>Try a different search term or category.</p>
        </div>
      ) : (
        <div className="formula-grid">
          {filtered.map((calc) => (
            <button
              key={calc.id}
              type="button"
              className="formula-card"
              style={{ textAlign: "left", cursor: "pointer", width: "100%", font: "inherit" }}
              onClick={() => setSelected(calc)}
            >
              <div className="formula-card-head">
                <h3 className="formula-card-name">{calc.name}</h3>
                <span className="formula-card-category">{calc.category}</span>
              </div>
              <p className="formula-card-expression">{calc.formula}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Interactive solve panel for one calculator — pick the unknown, fill the rest. */
function CalculatorDetail({
  calculator,
  onBack,
}: {
  calculator: CalculatorDef;
  onBack: () => void;
}) {
  const [solveFor, setSolveFor] = useState(calculator.solvableFor[0]);
  const [values, setValues] = useState<Record<string, string>>({});

  const inputFields = calculator.fields.filter((f) => f.id !== solveFor);
  const solveField = calculator.fields.find((f) => f.id === solveFor)!;

  const result = useMemo(() => {
    const known: Record<string, number> = {};
    for (const field of inputFields) {
      const raw = values[field.id];
      if (raw === undefined || raw.trim() === "") return null;
      const num = Number(raw);
      if (Number.isNaN(num)) return null;
      known[field.id] = num;
    }
    try {
      return calculator.compute(known, solveFor);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, solveFor, calculator]);

  return (
    <div className="page formula-page">
      <div className="tools-back-note">
        <button
          type="button"
          className="tools-back-link"
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
        >
          <ArrowLeft size={14} /> All Calculators
        </button>
      </div>

      <div className="section-heading">
        <p className="eyebrow">{calculator.category}</p>
        <h2>{calculator.name}</h2>
      </div>

      <div className="ui-card" style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 }}>
        <p className="formula-card-expression">{calculator.formula}</p>

        <div className="ui-field">
          <label className="ui-field-label">Solve for</label>
          <div className="settings-pill-row">
            {calculator.solvableFor.map((id) => {
              const field = calculator.fields.find((f) => f.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`settings-pill ${solveFor === id ? "settings-pill-active" : ""}`}
                  onClick={() => setSolveFor(id)}
                >
                  {field?.symbol ?? id}
                </button>
              );
            })}
          </div>
        </div>

        {inputFields.map((field) => (
          <div key={field.id} className="ui-field">
            <label className="ui-field-label">
              {field.label} ({field.symbol}){field.unit && ` — ${field.unit}`}
            </label>
            <input
              type="number"
              className="ui-input"
              placeholder={`Enter ${field.symbol}`}
              value={values[field.id] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
            />
          </div>
        ))}

        <div className="report-metric">
          <span className="report-metric-label">
            {solveField.label} ({solveField.symbol})
          </span>
          <span className="report-metric-value">
            {result === null ? "—" : `${formatResult(result)} ${solveField.unit}`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default EngineeringCalculatorsPage;