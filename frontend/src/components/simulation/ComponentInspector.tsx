/**
 * Component specification box — shown when a canvas component is selected.
 */
import { X } from "lucide-react";
import type { ComponentInstance } from "./editorTypes";
import { unitForProperty } from "./editorUtils";

interface ComponentInspectorProps {
  component: ComponentInstance | null;
  onUpdateProperty: (id: string, property: string, value: number | string | boolean) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onRotateComponent?: (id: string) => void;
  /** Close / deselect (popover mode). */
  onClose?: () => void;
  /** Floating card on the canvas vs sidebar strip. */
  variant?: "sidebar" | "popover";
}

function formatPropertyLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ComponentInspector({
  component,
  onUpdateProperty,
  onDeleteComponent,
  onDuplicateComponent,
  onRotateComponent,
  onClose,
  variant = "popover",
}: ComponentInspectorProps) {
  if (!component) {
    if (variant === "popover") return null;
    return (
      <div className="sim-inspector-empty">
        <p>Select a component on the canvas to edit its values.</p>
      </div>
    );
  }

  const handlePropertyChange = (key: string, value: string) => {
    const num = parseFloat(value);
    const finalValue = isNaN(num) ? value : num;
    onUpdateProperty(component.id, key, finalValue);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateProperty(component.id, "__label__", e.target.value);
  };

  const rootClass =
    variant === "popover" ? "sim-inspector sim-inspector--popover" : "sim-inspector";

  return (
    <div className={rootClass} role="dialog" aria-label={`${component.label} specifications`}>
      <div className="sim-inspector-header">
        <div className="sim-inspector-heading">
          <h4 className="sim-inspector-title">{component.label}</h4>
          <span className="sim-inspector-type">{component.type.replace(/_/g, " ")}</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="sim2-panel-close"
            onClick={onClose}
            title="Close specifications"
            aria-label="Close specifications"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="sim-inspector-body">
        <p className="sim-inspector-hint">Set values for this component, then Run to update results.</p>

        <div className="sim-inspector-field">
          <label className="sim-inspector-label" htmlFor={`spec-label-${component.id}`}>
            Label
          </label>
          <input
            id={`spec-label-${component.id}`}
            className="sim-inspector-input"
            type="text"
            value={component.label}
            onChange={handleLabelChange}
          />
        </div>

        {Object.entries(component.properties).map(([key, value]) => {
          if (key === "state" || key === "closed") return null;
          const displayValue = typeof value === "number" ? value.toString() : String(value);
          const unit = unitForProperty(key);
          const inputId = `spec-${component.id}-${key}`;
          return (
            <div key={key} className="sim-inspector-field">
              <label className="sim-inspector-label" htmlFor={inputId}>
                {formatPropertyLabel(key)}
              </label>
              <div className="sim-inspector-input-row">
                <input
                  id={inputId}
                  className="sim-inspector-input"
                  type="text"
                  inputMode="decimal"
                  value={displayValue}
                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                />
                {unit ? <span className="sim-inspector-unit">{unit}</span> : null}
              </div>
            </div>
          );
        })}

        {"closed" in component.properties && (
          <div className="sim-inspector-field">
            <label className="sim-inspector-label">Switch</label>
            <button
              type="button"
              className={`sim-inspector-toggle${component.properties.closed ? " sim-inspector-toggle--on" : ""}`}
              onClick={() =>
                onUpdateProperty(component.id, "closed", !Boolean(component.properties.closed))
              }
            >
              {component.properties.closed ? "Closed (ON)" : "Open (OFF)"}
            </button>
          </div>
        )}

        <div className="sim-inspector-actions">
          {onRotateComponent && (
            <button
              type="button"
              className="sim-inspector-btn"
              onClick={() => onRotateComponent(component.id)}
            >
              Rotate 90°
            </button>
          )}
          <button
            type="button"
            className="sim-inspector-btn"
            onClick={() => onDuplicateComponent(component.id)}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="sim-inspector-btn sim-inspector-btn--danger"
            onClick={() => onDeleteComponent(component.id)}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComponentInspector;
