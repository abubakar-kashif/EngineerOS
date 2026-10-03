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
  experimentId?: string | null;
  onOpenInstrument?: (instrument: "oscilloscope" | "dmm" | "generator") => void;
  selectedInstrument?: "oscilloscope" | "dmm" | "generator" | null;
}

function ComponentPalette({
  onSelectType,
  selectedType,
  experimentId,
  onOpenInstrument,
  selectedInstrument,
}: ComponentPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const visible = useMemo(
    () => filterPaletteEntries(query, experimentId),
    [query, experimentId],
  );

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
          visible.map((comp) => {
            const pressed = comp.instrument
              ? selectedInstrument === comp.instrument
              : activeId === comp.id && selectedType === comp.type;
            return (
            <button
              key={comp.id}
              type="button"
              className={`sim-palette-item ${pressed ? "sim-palette-item--active" : ""}`}
              onClick={() => {
                setActiveId(comp.id);
                if (comp.instrument) {
                  onOpenInstrument?.(comp.instrument);
                  return;
                }
                onSelectType(comp.type, comp.propertyOverrides);
                if (comp.id === "function_generator") onOpenInstrument?.("generator");
              }}
              title={comp.instrument ? `${comp.label} — instrument` : comp.label}
              aria-label={comp.label}
              aria-pressed={pressed}
            >
              <span className="sim-palette-symbol">{comp.icon}</span>
              <span className="sim-palette-label">{comp.label}</span>
            </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ComponentPalette;
