/**
 * Component palette: click to enter placement mode for the freeform canvas.
 * Search recognizes AC / source / function generator / sine / generator aliases.
 */
import { useMemo, useState } from "react";
import type { ComponentProperties, ComponentType } from "./editorTypes";
import { filterPaletteEntries } from "./paletteCatalog";

interface ComponentPaletteProps {
  onSelectType: (type: ComponentType, propertyOverrides?: ComponentProperties) => void;
  selectedType: ComponentType | null;
}

function ComponentPalette({ onSelectType, selectedType }: ComponentPaletteProps) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterPaletteEntries(query), [query]);

  return (
    <div className="sim-palette">
      <h4 className="sim-palette-title">Components</h4>
      <input
        type="search"
        className="sim-palette-search"
        placeholder="Search (AC, generator…)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search components"
      />
      <div className="sim-palette-items">
        {visible.length === 0 ? (
          <p className="sim-palette-empty">No components match.</p>
        ) : (
          visible.map((comp) => (
            <button
              key={comp.id}
              type="button"
              className={`sim-palette-item ${
                selectedType === comp.type ? "sim-palette-item--active" : ""
              }`}
              onClick={() => onSelectType(comp.type, comp.propertyOverrides)}
              title={comp.label}
              aria-label={comp.label}
              aria-pressed={selectedType === comp.type}
            >
              <span className="sim-palette-symbol">{comp.icon}</span>
              <span className="sim-palette-label">{comp.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default ComponentPalette;
