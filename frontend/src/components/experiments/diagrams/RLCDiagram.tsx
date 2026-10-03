import { W, R_H, Ind_H, Cap_H, Sw_H, Bat, L } from "./primitives";

/** Series RLC: battery → switch → R → L → C → return. */
function RLCDiagram() {
  return (
    <svg
      viewBox="0 0 480 260"
      className="diagram-svg"
      role="img"
      aria-label="Series RLC circuit: battery, switch, resistor, inductor, and capacitor"
    >
      <Bat x={50} y={50} h={160} voltage="V" />

      <W d="M50 50 L50 30 L100 30" />
      <Sw_H x={100} y={30} w={36} label="S" />
      <W d="M136 30 L170 30" />
      <R_H x={170} y={30} w={64} label="R" />
      <W d="M234 30 L260 30" />
      <Ind_H x={260} y={30} w={64} label="L" />
      <W d="M324 30 L360 30" />
      <Cap_H x={360} y={30} w={40} label="C" />
      <W d="M400 30 L420 30 L420 50" />

      <W d="M420 210 L420 230 L50 230 L50 210" />

      <L x={240} y={195} size={11}>
        series RLC
      </L>
    </svg>
  );
}

export default RLCDiagram;
