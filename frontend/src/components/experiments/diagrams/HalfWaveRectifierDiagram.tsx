import { W, R_H, Diode_H, Bat, Meter, L } from "./primitives";

/** Half-wave rectifier: AC source → diode → load → return; scope probes on Vin and Vout. */
function HalfWaveRectifierDiagram() {
  return (
    <svg
      viewBox="0 0 480 280"
      className="diagram-svg"
      role="img"
      aria-label="Half-wave rectifier: AC source, diode, and load resistor with Vin and Vout probes"
    >
      <Bat x={60} y={50} h={160} voltage="Vin~" />

      <W d="M60 50 L60 30 L120 30" />
      <Diode_H x={120} y={30} w={48} label="D" />
      <W d="M168 30 L220 30" />
      <R_H x={220} y={30} w={64} label="RL" />
      <W d="M284 30 L400 30 L400 50" />

      <W d="M400 210 L400 230 L60 230 L60 210" />

      {/* Channel A: input across source */}
      <W d="M60 50 L60 120" dashed />
      <W d="M60 210 L90 210 L90 120" dashed />
      <Meter cx={90} cy={120} letter="A" label="Vin" />

      {/* Channel B: output across load */}
      <W d="M220 30 L220 120" dashed />
      <W d="M284 30 L284 120" dashed />
      <Meter cx={252} cy={120} letter="B" label="Vout" />

      <L x={240} y={250} size={11}>
        half-wave rectifier
      </L>
    </svg>
  );
}

export default HalfWaveRectifierDiagram;
