import { W, R_H, Ind_H, Sw_H, Bat, L } from "./primitives";

/** RL circuit: battery → switch → resistor → inductor → return. */
function RLDiagram() {
  return (
    <svg
      viewBox="0 0 480 260"
      className="diagram-svg"
      role="img"
      aria-label="RL circuit: battery, switch, resistor, and inductor in series"
    >
      <Bat x={70} y={50} h={160} voltage="V" />

      <W d="M70 50 L70 30 L130 30" />
      <Sw_H x={130} y={30} w={40} label="S" />
      <W d="M170 30 L220 30" />
      <R_H x={220} y={30} w={72} label="R" />
      <W d="M292 30 L330 30" />
      <Ind_H x={330} y={30} w={70} label="L" />
      <W d="M400 30 L400 50" />

      <W d="M400 210 L400 230 L70 230 L70 210" />

      <L x={240} y={195} size={11}>
        τ = L/R
      </L>
    </svg>
  );
}

export default RLDiagram;
