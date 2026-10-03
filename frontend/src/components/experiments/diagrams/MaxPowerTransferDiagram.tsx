import { W, Bat, J, L, Meter, Gnd, R_H, R_V } from "./primitives";

/** Source network with variable load for maximum power transfer. */
function MaxPowerTransferDiagram() {
  return (
    <svg
      viewBox="0 0 540 300"
      className="diagram-svg"
      role="img"
      aria-label="Source network with variable load; maximum power when RL equals Rth"
    >
      <Bat x={50} y={40} h={160} voltage="Vs" />
      <W d="M50 40 L160 40" />
      <R_H x={160} y={40} label="R1" />
      <W d="M224 40 L300 40 L300 100" />
      <J cx={300} cy={100} />

      <W d="M300 100 L300 120" />
      <R_V x={300} y={120} h={64} label="R2" />
      <W d="M300 184 L300 240 L50 240" />
      <Gnd x={50} y={240} />
      <W d="M50 200 L50 240" />

      <W d="M300 100 L380 100" />
      <R_H x={380} y={100} label="RL" />
      <W d="M444 100 L444 240 L300 240" />

      <Meter cx={360} cy={55} letter="V" label="VL" />
      <W d="M300 100 L360 70" dashed />

      <L x={400} y={170} size={12}>
        PL = VL · IL
      </L>
      <L x={400} y={190} size={11}>
        max when RL = Rth
      </L>
      <L x={400} y={210} size={11}>
        Pmax = Vth² / (4 Rth)
      </L>
    </svg>
  );
}

export default MaxPowerTransferDiagram;
