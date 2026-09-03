import { W, R_H, Cap_H, Sw_H, Bat, L } from "./primitives";

/** RC circuit: battery → switch → resistor → capacitor → return. */
function RCDiagram() {
  return (
    <svg viewBox="0 0 480 260" className="diagram-svg" role="img" aria-label="RC circuit: battery, switch, resistor, and capacitor in series">
      <Bat x={70} y={50} h={160} voltage="V" />

      {/* Top wire: battery (+) → switch → resistor → right */}
      <W d="M70 50 L70 30 L130 30" />
      <Sw_H x={130} y={30} w={40} label="S" />
      <W d="M170 30 L220 30" />
      <R_H x={220} y={30} w={72} label="R" />
      <W d="M292 30 L400 30 L400 50" />

      {/* Right side down */}
      <W d="M400 210 L400 230" />

      {/* Capacitor on bottom */}
      <Cap_H x={240} y={230} w={48} label="C" />
      <W d="M240 230 L70 230 L70 210" />
      <W d="M288 230 L400 230" />

      {/* τ label */}
      <L x={240} y={195} size={11}>τ = RC</L>

      {/* Polarity markers */}
      <L x={230} y={218} size={9} anchor="end">+</L>
      <L x={298} y={218} size={9} anchor="start">−</L>
    </svg>
  );
}

export default RCDiagram;
