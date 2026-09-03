import { W, R_V, Bat, J, L } from "./primitives";

/** Voltage divider: R1 and R2 in series, V_out taken across R2. */
function VoltageDividerDiagram() {
  return (
    <svg viewBox="0 0 480 300" className="diagram-svg" role="img" aria-label="Voltage divider: two series resistors with output voltage taken across the lower resistor">
      <Bat x={80} y={40} h={220} voltage="V_in" />

      {/* Top wire from battery (+) to R1 */}
      <W d="M80 40 L80 25 L200 25 L200 60" />

      {/* R1 vertical */}
      <R_V x={200} y={60} h={64} label="R₁" />

      {/* Junction between R1 and R2 */}
      <W d="M200 124 L200 140" />
      <J cx={200} cy={140} />

      {/* R2 vertical */}
      <R_V x={200} y={140} h={64} label="R₂" />

      {/* Bottom return */}
      <W d="M200 204 L200 260 L80 260 L80 260" />

      {/* V_out tap wire */}
      <W d="M200 140 L340 140" dashed />
      <W d="M200 260 L340 260" dashed />

      {/* V_out label */}
      <L x={356} y={196} size={13}>V_out</L>

      {/* Output terminals */}
      <circle cx={340} cy={140} r={3} fill="currentColor" />
      <circle cx={340} cy={260} r={3} fill="currentColor" />

      {/* Formula */}
      <L x={360} y={220} size={11}>V_out = V_in × R₂/(R₁+R₂)</L>
    </svg>
  );
}

export default VoltageDividerDiagram;
