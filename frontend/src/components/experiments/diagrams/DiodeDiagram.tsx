import { W, R_H, Diode_H, Bat, Meter, L } from "./primitives";

/** Diode I-V characteristics: battery → resistor → diode → return, with V and I meters. */
function DiodeDiagram() {
  return (
    <svg viewBox="0 0 480 280" className="diagram-svg" role="img" aria-label="Diode characteristics circuit: battery, limiting resistor, and diode in series with ammeter and voltmeter">
      <Bat x={70} y={50} h={160} voltage="V" />

      {/* Top wire */}
      <W d="M70 50 L70 30 L400 30 L400 50" />
      {/* Bottom wire */}
      <W d="M400 210 L400 230 L70 230 L70 210" />

      {/* Current-limiting resistor */}
      <R_H x={120} y={30} w={56} label="R" />

      {/* Diode (forward biased) */}
      <Diode_H x={240} y={30} w={44} label="D" />

      {/* Ammeter */}
      <Meter cx={360} cy={30} letter="A" label="I" />

      {/* Voltmeter across diode */}
      <W d="M240 30 L240 110" dashed />
      <W d="M284 30 L284 110" dashed />
      <Meter cx={262} cy={120} letter="V" label="V_D" />

      {/* Direction arrow */}
      <L x={200} y={18}>I_F</L>
    </svg>
  );
}

export default DiodeDiagram;
