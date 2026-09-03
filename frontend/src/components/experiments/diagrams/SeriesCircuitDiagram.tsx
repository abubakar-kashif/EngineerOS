import { W, R_H, Bat, Meter, L } from "./primitives";

/** Two resistors in series with ammeter and voltmeters. */
function SeriesCircuitDiagram() {
  return (
    <svg viewBox="0 0 480 260" className="diagram-svg" role="img" aria-label="Series circuit: voltage source with two resistors in series">
      <Bat x={70} y={50} h={160} voltage="V" />
      <W d="M70 50 L70 30 L410 30 L410 50" />
      <W d="M410 210 L410 230 L70 230 L70 210" />

      <Meter cx={130} cy={30} letter="A" />
      <R_H x={190} y={30} w={64} label="R₁" />
      <R_H x={290} y={30} w={64} label="R₂" />

      {/* Voltage labels */}
      <L x={222} y={58} size={10}>V₁</L>
      <L x={322} y={58} size={10}>V₂</L>
    </svg>
  );
}

export default SeriesCircuitDiagram;
