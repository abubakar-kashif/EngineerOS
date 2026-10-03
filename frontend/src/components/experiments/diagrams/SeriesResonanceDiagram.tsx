import { W, R_H, Ind_H, Cap_H, Bat, L } from "./primitives";

/** Driven series RLC for resonance: AC source → R → L → C → return. */
function SeriesResonanceDiagram() {
  return (
    <svg
      viewBox="0 0 480 260"
      className="diagram-svg"
      role="img"
      aria-label="Series resonance: AC source, resistor, inductor, and capacitor"
    >
      <Bat x={50} y={50} h={160} voltage="Vin~" />

      <W d="M50 50 L50 30 L100 30" />
      <R_H x={100} y={30} w={64} label="R" />
      <W d="M164 30 L200 30" />
      <Ind_H x={200} y={30} w={64} label="L" />
      <W d="M264 30 L300 30" />
      <Cap_H x={300} y={30} w={40} label="C" />
      <W d="M340 30 L420 30 L420 50" />

      <W d="M420 210 L420 230 L50 230 L50 210" />

      <L x={240} y={195} size={11}>
        series resonance
      </L>
    </svg>
  );
}

export default SeriesResonanceDiagram;
