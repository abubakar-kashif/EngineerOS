import { W, R_H, LED_H, Bat, Meter, L } from "./primitives";

/** LED circuit: battery → resistor → LED → return, with current and voltage measurement. */
function LEDDiagram() {
  return (
    <svg viewBox="0 0 480 280" className="diagram-svg" role="img" aria-label="LED circuit: battery, current-limiting resistor, and LED in series">
      <Bat x={70} y={50} h={160} voltage="V_s" />

      {/* Top wire */}
      <W d="M70 50 L70 30 L400 30 L400 50" />
      {/* Bottom wire */}
      <W d="M400 210 L400 230 L70 230 L70 210" />

      {/* Current-limiting resistor */}
      <R_H x={120} y={30} w={56} label="R" />

      {/* LED */}
      <LED_H x={250} y={30} w={48} label="LED" />

      {/* Ammeter */}
      <Meter cx={370} cy={30} letter="A" label="I_F" />

      {/* Voltage across LED */}
      <W d="M250 30 L250 110" dashed />
      <W d="M298 30 L298 110" dashed />
      <Meter cx={274} cy={120} letter="V" label="V_F" />

      {/* Formula */}
      <L x={240} y={200} size={11}>R = (V_s − V_F) / I_F</L>
    </svg>
  );
}

export default LEDDiagram;
