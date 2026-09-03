import { W, R_V, Bat, J, Arr, L } from "./primitives";

/** Kirchhoff's Current Law: node with 3 branches, current arrows. */
function KCLDiagram() {
  return (
    <svg viewBox="0 0 480 300" className="diagram-svg" role="img" aria-label="KCL node: source current enters a junction, splits into three branch currents">
      <Bat x={70} y={30} h={240} voltage="V" />

      {/* Top wire to node */}
      <W d="M70 30 L70 15 L230 15" />

      {/* Node */}
      <J cx={230} cy={15} />

      {/* Branch 1 (R1) */}
      <W d="M230 15 L170 15 L170 60" />
      <R_V x={170} y={60} h={56} label="R₁" />
      <W d="M170 116 L170 140" />
      <Arr x1={170} y1={30} x2={170} y2={55} label="I₁" />

      {/* Branch 2 (R2) */}
      <W d="M230 15 L270 15 L270 60" />
      <R_V x={270} y={60} h={56} label="R₂" />
      <W d="M270 116 L270 140" />
      <Arr x1={270} y1={30} x2={270} y2={55} label="I₂" />

      {/* Branch 3 (R3) */}
      <W d="M230 15 L370 15 L370 60" />
      <R_V x={370} y={60} h={56} label="R₃" />
      <W d="M370 116 L370 140" />
      <Arr x1={370} y1={30} x2={370} y2={55} label="I₃" />

      {/* Return path */}
      <W d="M170 140 L370 140 L370 270 L70 270 L70 270" />

      {/* Source current arrow */}
      <Arr x1={100} y1={15} x2={160} y2={15} label="Iₛ" />

      {/* KCL equation */}
      <L x={270} y={180} size={12}>Iₛ = I₁ + I₂ + I₃</L>
    </svg>
  );
}

export default KCLDiagram;
