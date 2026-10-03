import { W, Bat, J, L, Meter, Gnd, R_H, R_V } from "./primitives";

/** Two-source network used to illustrate the superposition theorem. */
function SuperpositionDiagram() {
  return (
    <svg
      viewBox="0 0 520 300"
      className="diagram-svg"
      role="img"
      aria-label="Two voltage sources feeding a common load through series resistors"
    >
      <Bat x={60} y={30} h={80} voltage="V1" />
      <Bat x={60} y={160} h={80} voltage="V2" />

      <W d="M60 30 L180 30" />
      <R_H x={180} y={30} label="R1" />
      <W d="M244 30 L320 30 L320 120" />
      <J cx={320} cy={120} />

      <W d="M60 160 L180 160" />
      <R_H x={180} y={160} label="R2" />
      <W d="M244 160 L320 160 L320 120" />

      <W d="M320 120 L320 140" />
      <R_V x={320} y={140} h={64} label="RL" />
      <W d="M320 204 L320 280 L60 280" />
      <Gnd x={60} y={280} />

      <W d="M60 110 L60 140" />
      <W d="M60 240 L60 280" />

      <Meter cx={400} cy={120} letter="V" label="V_L" />
      <W d="M336 120 L386 120" />
      <W d="M400 134 L400 280 L320 280" dashed />

      <L x={420} y={200} size={12}>
        X_total = X1 + X2
      </L>
      <L x={420} y={220} size={11}>
        (deactivate other sources)
      </L>
    </svg>
  );
}

export default SuperpositionDiagram;
