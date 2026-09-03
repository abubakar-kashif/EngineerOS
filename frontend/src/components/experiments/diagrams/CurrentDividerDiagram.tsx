import { W, R_V, Bat, J, Arr, L } from "./primitives";

/** Current divider: two parallel resistors with branch current arrows. */
function CurrentDividerDiagram() {
  return (
    <svg viewBox="0 0 480 290" className="diagram-svg" role="img" aria-label="Current divider: source current splits into two parallel branches through R1 and R2">
      <Bat x={70} y={30} h={230} voltage="V" />

      {/* Top wire */}
      <W d="M70 30 L70 15 L180 15" />

      {/* Junction top */}
      <J cx={180} cy={15} />

      {/* Branch 1 (R1) */}
      <W d="M180 15 L180 60" />
      <R_V x={180} y={60} h={64} label="R₁" />
      <W d="M180 124 L180 160" />
      <Arr x1={180} y1={30} x2={180} y2={56} label="I₁" />

      {/* Branch 2 (R2) */}
      <W d="M180 15 L320 15 L320 60" />
      <J cx={320} cy={15} />
      <R_V x={320} y={60} h={64} label="R₂" />
      <W d="M320 124 L320 160" />
      <Arr x1={320} y1={30} x2={320} y2={56} label="I₂" />

      {/* Bottom junction → return */}
      <J cx={180} cy={160} />
      <J cx={320} cy={160} />
      <W d="M180 160 L320 160" />
      <W d="M180 160 L180 260 L70 260" />

      {/* Source current arrow */}
      <Arr x1={100} y1={15} x2={168} y2={15} label="I_total" />

      {/* Formula */}
      <L x={240} y={210} size={11}>I₁ = I × R₂/(R₁+R₂)</L>
      <L x={240} y={230} size={11}>I₂ = I × R₁/(R₁+R₂)</L>
    </svg>
  );
}

export default CurrentDividerDiagram;
