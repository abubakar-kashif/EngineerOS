import { W, R_H, Diode_H, L } from "./primitives";

/** Four-diode bridge: AC across the left/right corners, load from top to bottom. */
function FullWaveBridgeDiagram() {
  return (
    <svg
      viewBox="0 0 480 280"
      className="diagram-svg"
      role="img"
      aria-label="Full-wave bridge rectifier with four diodes and a load resistor"
    >
      <W d="M40 140 L90 140" />
      <L x={24} y={144} size={11}>
        AC
      </L>
      <W d="M90 140 L90 70 L130 70" />
      <Diode_H x={130} y={70} w={48} label="D1" />
      <W d="M178 70 L240 70" />
      <W d="M90 140 L90 210 L130 210" />
      <Diode_H x={130} y={210} w={48} label="D3" />
      <W d="M178 210 L240 210" />

      <W d="M390 140 L440 140" />
      <W d="M390 140 L390 70 L302 70" />
      <Diode_H x={254} y={70} w={48} label="D2" />
      <W d="M390 140 L390 210 L302 210" />
      <Diode_H x={254} y={210} w={48} label="D4" />

      <W d="M240 70 L240 110" />
      <R_H x={240} y={110} w={70} label="RL" />
      <W d="M310 110 L310 210 L240 210" />

      <L x={240} y={250} size={11}>
        full-wave bridge
      </L>
    </svg>
  );
}

export default FullWaveBridgeDiagram;
