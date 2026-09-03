/**
 * Empty canvas state: guides the user to start building a circuit.
 */

function EmptyCanvasState() {
  return (
    <div className="sim-empty-state">
      <div className="sim-empty-icon">
        <svg viewBox="0 0 48 48" width={48} height={48} fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x={4} y={4} width={40} height={40} rx={4} strokeDasharray="4 4" />
          <line x1={24} y1={16} x2={24} y2={32} />
          <line x1={16} y1={24} x2={32} y2={24} />
        </svg>
      </div>
      <h3 className="sim-empty-title">Build Your Circuit</h3>
      <p className="sim-empty-desc">
        Select a component from the library on the left, then click on the canvas to place it.
        Click terminals to draw wires between components.
      </p>
      <div className="sim-empty-steps">
        <div className="sim-empty-step">
          <span className="sim-empty-step-num">1</span>
          <span>Pick a component</span>
        </div>
        <div className="sim-empty-step">
          <span className="sim-empty-step-num">2</span>
          <span>Click to place</span>
        </div>
        <div className="sim-empty-step">
          <span className="sim-empty-step-num">3</span>
          <span>Connect terminals</span>
        </div>
        <div className="sim-empty-step">
          <span className="sim-empty-step-num">4</span>
          <span>Run simulation</span>
        </div>
      </div>
    </div>
  );
}

export default EmptyCanvasState;
