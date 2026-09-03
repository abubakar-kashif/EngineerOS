import { W, R_H, Bat, L } from "./primitives";

/** Kirchhoff's Voltage Law: loop with source and 3 resistors, voltage labels. */
function KVLDiagram() {
  return (
    <svg viewBox="0 0 480 260" className="diagram-svg" role="img" aria-label="KVL loop: voltage source with three resistors, showing voltage drops around the loop">
      <Bat x={70} y={40} h={180} voltage="Vₛ" />

      {/* Top wire */}
      <W d="M70 40 L70 25 L420 25 L420 40" />
      {/* Right side */}
      <W d="M420 220 L420 235 L70 235 L70 220" />

      {/* Three resistors */}
      <R_H x={130} y={25} w={56} label="R₁" />
      <R_H x={220} y={25} w={56} label="R₂" />
      <R_H x={310} y={25} w={56} label="R₃" />

      {/* Voltage drop labels */}
      <L x={158} y={55} size={10}>V₁</L>
      <L x={248} y={55} size={10}>V₂</L>
      <L x={338} y={55} size={10}>V₃</L>

      {/* KVL equation */}
      <L x={240} y={210} size={12}>ΣV = Vₛ − V₁ − V₂ − V₃ = 0</L>
    </svg>
  );
}

export default KVLDiagram;
