/**
 * Component inspector: displays and edits the properties of the selected component.
 */
import type { ComponentInstance } from "./engine/types";
import { unitForProperty } from "./engine/units";

interface ComponentInspectorProps {
  component: ComponentInstance | null;
  onChange: (id: string, property: string, value: number | string | boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRotate: (id: string) => void;
}

function ComponentInspector({ component, onChange, onDelete, onDuplicate, onRotate }: ComponentInspectorProps) {
  if (!component) {
    return (
      <div className="sim-inspector">
        <p className="eyebrow">INSPECTOR</p>
        <p className="sim-inspector-empty">Select a component to view its properties.</p>
      </div>
    );
  }

  const editableProps = Object.entries(component.properties).filter(
    ([key]) => key !== "color",
  );

  return (
    <div className="sim-inspector">
      <p className="eyebrow">INSPECTOR</p>
      <h3 className="sim-inspector-title">{component.label}</h3>
      <div className="sim-inspector-type">
        Type: <strong>{component.type.replace(/_/g, " ")}</strong>
      </div>

      <div className="sim-inspector-fields">
        {editableProps.map(([key, val]) => {
          const unit = unitForProperty(component.type, key);
          const inputId = `insp-${component.id}-${key}`;
          return (
            <div key={key} className="sim-inspector-field">
              <label htmlFor={inputId} className="sim-inspector-label">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </label>
              <div className="sim-inspector-input-row">
                {typeof val === "boolean" ? (
                  <button
                    className={`sim-inspector-toggle ${val ? "sim-inspector-toggle--on" : ""}`}
                    onClick={() => onChange(component.id, key, !val)}
                  >
                    {val ? "ON / Closed" : "OFF / Open"}
                  </button>
                ) : (
                  <>
                    <input
                      id={inputId}
                      type="number"
                      className="sim-inspector-input"
                      value={val as number}
                      step={typeof val === "number" && val < 1 ? 0.001 : 1}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value);
                        if (!isNaN(n)) onChange(component.id, key, n);
                      }}
                    />
                    {unit && <span className="sim-inspector-unit">{unit}</span>}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Label (read-only reference designator) */}
        <div className="sim-inspector-field">
          <label className="sim-inspector-label">Label</label>
          <div className="sim-inspector-input-row">
            <input
              type="text"
              className="sim-inspector-input"
              value={component.label}
              onChange={(e) => onChange(component.id, "__label__", e.target.value)}
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="sim-inspector-field">
          <label className="sim-inspector-label">Rotation</label>
          <div className="sim-inspector-input-row">
            <span className="sim-inspector-value">{component.rotation}°</span>
            <button className="sim-inspector-btn" onClick={() => onRotate(component.id)}>
              Rotate 90°
            </button>
          </div>
        </div>
      </div>

      <div className="sim-inspector-actions">
        <button className="sim-inspector-btn" onClick={() => onDuplicate(component.id)}>
          Duplicate
        </button>
        <button className="sim-inspector-btn sim-inspector-btn--danger" onClick={() => onDelete(component.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default ComponentInspector;
