import { W, R_V, Bat, J, L, Meter } from "./primitives";

/** Wheatstone bridge: two dividers with Vout between midpoints. */
function WheatstoneBridgeDiagram() {
  return (
    <svg
      viewBox="0 0 480 300"
      className="diagram-svg"
      role="img"
      aria-label="Wheatstone bridge with four resistors and output between midpoints"
    >
      <Bat x={60} y={40} h={220} voltage="V_in" />

      {/* Top rail */}
      <W d="M60 40 L60 28 L180 28 L300 28" />
      <J cx={180} cy={28} />
      <J cx={300} cy={28} />

      {/* Left branch R1 / R2 */}
      <W d="M180 28 L180 50" />
      <R_V x={180} y={50} h={64} label="R₁" />
      <W d="M180 114 L180 140" />
      <J cx={180} cy={140} />
      <R_V x={180} y={140} h={64} label="R₂" />
      <W d="M180 204 L180 260" />

      {/* Right branch R3 / R4 */}
      <W d="M300 28 L300 50" />
      <R_V x={300} y={50} h={64} label="R₃" />
      <W d="M300 114 L300 140" />
      <J cx={300} cy={140} />
      <R_V x={300} y={140} h={64} label="R₄" />
      <W d="M300 204 L300 260" />

      {/* Bottom rail + ground return */}
      <W d="M180 260 L300 260 L300 260 L60 260 L60 260" />
      <J cx={180} cy={260} />
      <J cx={300} cy={260} />

      {/* Vout sense */}
      <W d="M180 140 L240 140" dashed />
      <W d="M300 140 L240 140" dashed />
      <Meter cx={240} cy={168} letter="V" label="V_out" />

      <L x={155} y={128} size={10}>
        left
      </L>
      <L x={325} y={128} size={10}>
        right
      </L>
      <L x={390} y={200} size={11}>
        R₁/R₂ = R₃/R₄
      </L>
      <L x={390} y={220} size={11}>
        ⇒ V_out = 0
      </L>
    </svg>
  );
}

export default WheatstoneBridgeDiagram;
