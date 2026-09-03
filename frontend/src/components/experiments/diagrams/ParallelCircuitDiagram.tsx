import { W, R_V, Bat, Meter, J, L } from "./primitives";

/** Two resistors in parallel with ammeter on main branch. */
function ParallelCircuitDiagram() {
  return (
    <svg viewBox="0 0 480 280" className="diagram-svg" role="img" aria-label="Parallel circuit: voltage source with two resistors in parallel branches">
      <Bat x={70} y={40} h={200} voltage="V" />

      {/* Top wire */}
      <W d="M70 40 L70 20 L180 20" />
      <Meter cx={140} cy={20} letter="A" />

      {/* Junction */}
      <J cx={180} cy={20} />

      {/* Upper branch (R1) */}
      <W d="M180 20 L180 70" />
      <R_V x={180} y={70} h={64} label="R₁" />
      <W d="M180 134 L180 160" />

      {/* Lower branch (R2) */}
      <W d="M180 20 L280 20" />
      <J cx={280} cy={20} />
      <W d="M280 20 L280 70" />
      <R_V x={280} y={70} h={64} label="R₂" />
      <W d="M280 134 L280 160" />

      {/* Bottom junction → return */}
      <J cx={180} cy={160} />
      <J cx={280} cy={160} />
      <W d="M180 160 L280 160" />
      <W d="M180 160 L180 240 L70 240 L70 240" />

      {/* Branch current labels */}
      <L x={165} y={55} size={10}>I₁</L>
      <L x={295} y={55} size={10}>I₂</L>
    </svg>
  );
}

export default ParallelCircuitDiagram;
