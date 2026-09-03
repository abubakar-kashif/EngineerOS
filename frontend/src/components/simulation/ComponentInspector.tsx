/**
 * Inspector panel: shows details of the selected component and allows property editing.
 */
import type { ComponentInstance } from "./editorTypes";
import { unitForProperty } from "./editorUtils";

interface ComponentInspectorProps {
  component: ComponentInstance | null;
  onUpdateProperty: (id: string, property: string, value: number | string | boolean) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
}

function ComponentInspector({
  component,
  onUpdateProperty,
  onDeleteComponent,
  onDuplicateComponent,
}: ComponentInspectorProps) {
  if (!component) {
    return (
      <div className="sim-inspector-empty">
        <p>Select a component to inspect</p>
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

  return (
    <div className="sim-inspector">
      <div className="sim-inspector-header">
        <h4>{component.label}</h4>
        <span className="sim-inspector-type">{component.type.replace(/_/g, " ")}</span>
      </div>

      <div className="sim-inspector-body">
        <div className="sim-inspector-field">
          <label>Label</label>
          <input type="text" value={component.label} onChange={handleLabelChange} />
        </div>

        {Object.entries(component.properties).map(([key, value]) => {
          if (key === "state" || key === "closed") return null;
          const displayValue = typeof value === "number" ? value.toString() : String(value);
          return (
            <div key={key} className="sim-inspector-field">
              <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
              <div className="sim-inspector-field-row">
                <input
                  type="text"
                  value={displayValue}
                  onChange={(e) => handlePropertyChange(key, e.target.value)}
                />
                <span className="sim-inspector-unit">{unitForProperty(key)}</span>
              </div>
            </div>
          );
        })}

        <div className="sim-inspector-actions">
          <button
            className="sim-inspector-btn sim-inspector-btn--duplicate"
            onClick={() => onDuplicateComponent(component.id)}
          >
            Duplicate
          </button>
          <button
            className="sim-inspector-btn sim-inspector-btn--delete"
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