import { W, Bat, J, L, Meter, Gnd, R_H, R_V } from "./primitives";

/** Original network with Norton equivalent reminder. */
function NortonDiagram() {
  return (
    <svg
      viewBox="0 0 540 300"
      className="diagram-svg"
      role="img"
      aria-label="Network with load and Norton equivalent IL equals IN times RN over RN plus RL"
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

      <Meter cx={360} cy={60} letter="A" label="IL" />
      <W d="M340 100 L360 74" dashed />

      <L x={400} y={180} size={12}>
        IL = IN · RN / (RN + RL)
      </L>
      <L x={400} y={200} size={11}>
        IN = Isc , RN = Voc/Isc
      </L>
    </svg>
  );
}

export default NortonDiagram;
