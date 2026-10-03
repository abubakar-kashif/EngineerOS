import { W, Bat, J, L, Meter, Gnd } from "./primitives";

/** Potentiometer as variable voltage divider with wiper output. */
function PotentiometerDiagram() {
  return (
    <svg
      viewBox="0 0 480 280"
      className="diagram-svg"
      role="img"
      aria-label="Potentiometer voltage divider with wiper output to ground"
    >
      <Bat x={70} y={40} h={180} voltage="V_in" />
      <W d="M70 40 L70 30 L220 30" />
      <J cx={220} cy={30} />

      {/* Resistive track */}
      <W d="M220 30 L220 60" />
      <rect
        x={208}
        y={60}
        width={24}
        height={100}
        rx={3}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />
      <L x={250} y={90} size={12}>
        R_pot
      </L>
      <L x={198} y={55} size={10}>
        A
      </L>
      <L x={198} y={175} size={10}>
        B
      </L>

      {/* Wiper */}
      <W d="M232 110 L300 110" />
      <J cx={232} cy={110} />
      <L x={260} y={100} size={11}>
        wiper
      </L>
      <Meter cx={330} cy={110} letter="V" label="V_out" />
      <W d="M330 124 L330 220 L220 220" dashed />

      <W d="M220 160 L220 220" />
      <J cx={220} cy={220} />
      <W d="M220 220 L70 220 L70 220" />
      <Gnd x={70} y={220} />

      <L x={380} y={160} size={12}>
        V_out = α · V_in
      </L>
      <L x={380} y={180} size={11}>
        (unloaded)
      </L>
    </svg>
  );
}

export default PotentiometerDiagram;
