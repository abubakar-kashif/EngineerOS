import { W, R_H, Bat, Meter, L } from "./primitives";

/** Simple series circuit: Battery → Ammeter → Resistor → back, with Voltmeter across R. */
function OhmsLawDiagram() {
  return (
    <svg viewBox="0 0 480 260" className="diagram-svg" role="img" aria-label="Ohm's Law circuit: voltage source, ammeter in series, resistor, and voltmeter across the resistor">
      {/* Battery (left) */}
      <Bat x={70} y={50} h={160} voltage="V" />

      {/* Top wire: battery (+) → ammeter → resistor → right */}
      <W d="M70 50 L70 30 L410 30 L410 50" />
      {/* Bottom wire: right → battery (−) */}
      <W d="M410 210 L410 230 L70 230 L70 210" />

      {/* Ammeter */}
      <Meter cx={160} cy={30} letter="A" />

      {/* Resistor */}
      <R_H x={250} y={30} w={72} label="R" />

      {/* Voltmeter across resistor */}
      <W d="M250 30 L250 120" dashed />
      <W d="M322 30 L322 120" dashed />
      <Meter cx={286} cy={130} letter="V" />

      {/* Current direction arrow */}
      <L x={200} y={18}>I</L>
    </svg>
  );
}

export default OhmsLawDiagram;
