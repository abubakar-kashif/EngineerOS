import { W, R_H, Cap_V, L } from "./primitives";

/**
 * Series RC low-pass matching the starter:
 * function generator → R → output node → C to ground, probe across C.
 */
function RcLowPassDiagram() {
  return (
    <svg
      viewBox="0 0 520 280"
      className="diagram-svg"
      role="img"
      aria-label="RC low-pass filter: sine source, series resistor, capacitor to ground, output across the capacitor"
    >
      <circle cx="70" cy="120" r="28" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <L x={70} y={116} size={11}>FG</L>
      <L x={70} y={166} size={10}>sine</L>

      <W d="M98 120 L150 120" />
      <R_H x={150} y={120} w={80} label="R" />
      <W d="M230 120 L320 120" />

      <L x={300} y={100} size={11} anchor="end">Vout</L>
      <circle cx="320" cy="120" r="3.5" fill="currentColor" />

      <W d="M320 120 L320 70 L430 70" />
      <W d="M320 120 L320 168" />
      <Cap_V x={320} y={168} h={48} label="C" />
      <W d="M320 216 L320 240 L70 240 L70 148" />

      <W d="M70 240 L40 240 L40 248" />
      <W d="M28 248 L52 248" />
      <W d="M34 254 L46 254" />
      <L x={40} y={270} size={10}>GND</L>

      <L x={430} y={58} size={10} anchor="start">probe</L>
      <W d="M430 70 L430 240 L320 240" />
      <L x={210} y={40} size={12}>fc = 1 / (2πRC)</L>
    </svg>
  );
}

export default RcLowPassDiagram;
