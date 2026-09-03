import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowLeftRight } from "lucide-react";
import SectionHeading from "../../components/ui/SectionHeading";
import {
  UNIT_CATEGORIES,
  convertUnit,
  formatResult,
} from "../../services/tools/toolsService";

function UnitConverterPage() {
  const [categoryId, setCategoryId] = useState(UNIT_CATEGORIES[0].id);
  const category = UNIT_CATEGORIES.find((entry) => entry.id === categoryId) ?? UNIT_CATEGORIES[0];

  const [fromUnit, setFromUnit] = useState(category.units[0].id);
  const [toUnit, setToUnit] = useState(category.units[1].id);
  const [fromValue, setFromValue] = useState("1");
  const [toValue, setToValue] = useState(
    formatResult(convertUnit(1, category.id, category.units[0].id, category.units[1].id)),
  );

  const fromIsInvalid = fromValue.trim() !== "" && Number.isNaN(Number(fromValue));
  const toIsInvalid = toValue.trim() !== "" && Number.isNaN(Number(toValue));

  function switchCategory(nextCategoryId: string) {
    const next =
      UNIT_CATEGORIES.find((entry) => entry.id === nextCategoryId) ?? UNIT_CATEGORIES[0];
    setCategoryId(next.id);
    setFromUnit(next.units[0].id);
    setToUnit(next.units[1].id);
    setFromValue("1");
    setToValue(formatResult(convertUnit(1, next.id, next.units[0].id, next.units[1].id)));
  }

  function handleFromChange(value: string) {
    setFromValue(value);
    const parsed = Number(value);
    if (value.trim() === "" || Number.isNaN(parsed)) {
      setToValue("");
      return;
    }
    try {
      setToValue(formatResult(convertUnit(parsed, category.id, fromUnit, toUnit)));
    } catch {
      setToValue("");
    }
  }

  function handleToChange(value: string) {
    setToValue(value);
    const parsed = Number(value);
    if (value.trim() === "" || Number.isNaN(parsed)) {
      setFromValue("");
      return;
    }
    try {
      setFromValue(formatResult(convertUnit(parsed, category.id, toUnit, fromUnit)));
    } catch {
      setFromValue("");
    }
  }

  function swapUnits() {
    const previousFromUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(previousFromUnit);
    setFromValue(toValue);
    setToValue(fromValue);
  }

  const from = category.units.find((unit) => unit.id === fromUnit) ?? category.units[0];
  const to = category.units.find((unit) => unit.id === toUnit) ?? category.units[1];

  // Ratio hint only makes sense for pure-multiple units (not temperature).
  const ratioHint =
    from.factor !== null && to.factor !== null
      ? `1 ${from.symbol} = ${formatResult(convertUnit(1, category.id, fromUnit, toUnit))} ${to.symbol}`
      : `${from.label} → ${to.label} (offset conversion)`;

  return (
    <main className="page converter-page">
      <SectionHeading
        eyebrow="TOOLBOX"
        title="Unit Converter"
        description="Convert between engineering units in both directions — edit either field and the other follows."
      />

      <div className="converter-category-row" role="tablist" aria-label="Unit categories">
        {UNIT_CATEGORIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={entry.id === categoryId}
            className={`converter-category-pill${entry.id === categoryId ? " converter-category-pill-active" : ""}`}
            onClick={() => switchCategory(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="converter-shell">
        <div className="converter-pane">
          <label className="converter-label" htmlFor="converter-from">
            From
          </label>
          <input
            id="converter-from"
            className="converter-input"
            type="text"
            inputMode="decimal"
            value={fromValue}
            onChange={(event) => handleFromChange(event.target.value)}
            aria-invalid={fromIsInvalid}
            placeholder="Enter a value"
            autoComplete="off"
          />
          <select
            className="converter-select"
            value={fromUnit}
            aria-label="From unit"
            onChange={(event) => {
              setFromUnit(event.target.value);
              const parsed = Number(fromValue);
              if (!Number.isNaN(parsed) && fromValue.trim() !== "") {
                try {
                  setToValue(
                    formatResult(convertUnit(parsed, category.id, event.target.value, toUnit)),
                  );
                } catch {
                  setToValue("");
                }
              }
            }}
          >
            {category.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label} ({unit.symbol})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="converter-swap"
          onClick={swapUnits}
          aria-label="Swap units"
          title="Swap units"
        >
          <ArrowLeftRight size={16} />
        </button>

        <div className="converter-pane">
          <label className="converter-label" htmlFor="converter-to">
            To
          </label>
          <input
            id="converter-to"
            className="converter-input"
            type="text"
            inputMode="decimal"
            value={toValue}
            onChange={(event) => handleToChange(event.target.value)}
            aria-invalid={toIsInvalid}
            placeholder="Enter a value"
            autoComplete="off"
          />
          <select
            className="converter-select"
            value={toUnit}
            aria-label="To unit"
            onChange={(event) => {
              setToUnit(event.target.value);
              const parsed = Number(fromValue);
              if (!Number.isNaN(parsed) && fromValue.trim() !== "") {
                try {
                  setToValue(
                    formatResult(convertUnit(parsed, category.id, fromUnit, event.target.value)),
                  );
                } catch {
                  setToValue("");
                }
              }
            }}
          >
            {category.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label} ({unit.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="converter-hint">
        {(fromIsInvalid || toIsInvalid) ? "Enter a valid number to convert." : ratioHint}
      </p>

      <p className="tools-back-note">
        <Link to="/tools" className="tools-back-link">
          <ArrowLeft size={13} /> All tools
        </Link>
        <Link to="/tools/calculator" className="tools-back-link">
          Calculator <ArrowRight size={13} />
        </Link>
      </p>
    </main>
  );
}

export default UnitConverterPage;
