/** Reusable SVG building-blocks for circuit schematics.
 *  All coordinates use the standard viewBox 0 0 480 280 unless noted. */

const wire = {
  stroke: "currentColor",
  strokeWidth: 2,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const lbl = {
  fontSize: 11,
  fill: "currentColor",
  textAnchor: "middle" as const,
};

/* ── Wire path ── */
export function W({ d, dashed }: { d: string; dashed?: boolean }) {
  return <path d={d} {...wire} strokeDasharray={dashed ? "4 4" : undefined} />;
}

/* ── Resistor (horizontal zigzag, width w, starts at (x,y)) ── */
export function R_H({ x, y, w = 64, label }: { x: number; y: number; w?: number; label?: string }) {
  const lead = 8;
  const hc = (w - 2 * lead) / 8;
  const a = 8;
  const pts = [
    [x, y], [x + lead, y],
    [x + lead + hc, y - a], [x + lead + 2 * hc, y],
    [x + lead + 3 * hc, y + a], [x + lead + 4 * hc, y],
    [x + lead + 5 * hc, y - a], [x + lead + 6 * hc, y],
    [x + lead + 7 * hc, y + a], [x + lead + 8 * hc, y],
    [x + w, y],
  ];
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
  return (
    <g>
      <path d={d} {...wire} />
      {label && <text x={x + w / 2} y={y - 16} {...lbl}>{label}</text>}
    </g>
  );
}

/* ── Resistor (vertical zigzag, height h, starts at (x,y)) ── */
export function R_V({ x, y, h = 64, label }: { x: number; y: number; h?: number; label?: string }) {
  const lead = 8;
  const hc = (h - 2 * lead) / 8;
  const a = 8;
  const pts = [
    [x, y], [x, y + lead],
    [x - a, y + lead + hc], [x, y + lead + 2 * hc],
    [x + a, y + lead + 3 * hc], [x, y + lead + 4 * hc],
    [x - a, y + lead + 5 * hc], [x, y + lead + 6 * hc],
    [x + a, y + lead + 7 * hc], [x, y + lead + 8 * hc],
    [x, y + h],
  ];
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
  return (
    <g>
      <path d={d} {...wire} />
      {label && <text x={x + 18} y={y + h / 2 + 4} textAnchor="start" fontSize={11} fill="currentColor">{label}</text>}
    </g>
  );
}

/* ── Battery (vertical). Positive terminal at top (x,y), negative at (x, y+h). ── */
export function Bat({ x, y, h = 40, voltage }: { x: number; y: number; h?: number; voltage?: string }) {
  const gap = 10;
  const mid = y + h / 2;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={mid - gap} {...wire} />
      <line x1={x - 14} y1={mid - gap} x2={x + 14} y2={mid - gap} {...wire} />
      <line x1={x - 8} y1={mid + gap} x2={x + 8} y2={mid + gap} {...wire} />
      <line x1={x} y1={mid + gap} x2={x} y2={y + h} {...wire} />
      <text x={x + 20} y={mid - gap + 4} fontSize={13} fontWeight={700} fill="currentColor">+</text>
      <text x={x + 20} y={mid + gap + 5} fontSize={15} fill="currentColor">−</text>
      {voltage && <text x={x - 20} y={mid + 4} textAnchor="end" fontSize={11} fill="currentColor">{voltage}</text>}
    </g>
  );
}

/* ── Capacitor (horizontal). Terminals at (x,y) and (x+w, y). ── */
export function Cap_H({ x, y, w = 40, label }: { x: number; y: number; w?: number; label?: string }) {
  const gap = 6;
  const mid = x + w / 2;
  return (
    <g>
      <line x1={x} y1={y} x2={mid - gap} y2={y} {...wire} />
      <line x1={mid - gap} y1={y - 14} x2={mid - gap} y2={y + 14} {...wire} />
      <line x1={mid + gap} y1={y - 14} x2={mid + gap} y2={y + 14} {...wire} />
      <line x1={mid + gap} y1={y} x2={x + w} y2={y} {...wire} />
      {label && <text x={mid} y={y - 22} {...lbl}>{label}</text>}
    </g>
  );
}

/* ── Capacitor (vertical). Terminals at (x,y) and (x, y+h). ── */
export function Cap_V({ x, y, h = 40, label }: { x: number; y: number; h?: number; label?: string }) {
  const gap = 6;
  const mid = y + h / 2;
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={mid - gap} {...wire} />
      <line x1={x - 14} y1={mid - gap} x2={x + 14} y2={mid - gap} {...wire} />
      <line x1={x - 14} y1={mid + gap} x2={x + 14} y2={mid + gap} {...wire} />
      <line x1={x} y1={mid + gap} x2={x} y2={y + h} {...wire} />
      {label && <text x={x + 20} y={mid + 4} textAnchor="start" fontSize={11} fill="currentColor">{label}</text>}
    </g>
  );
}

/* ── Diode (horizontal). Anode at (x,y), cathode at (x+w, y). ── */
export function Diode_H({ x, y, w = 40, label }: { x: number; y: number; w?: number; label?: string }) {
  const lead = (w - 16) / 2;
  const tx = x + lead;
  return (
    <g>
      <line x1={x} y1={y} x2={tx} y2={y} {...wire} />
      <polygon points={`${tx},${y - 9} ${tx},${y + 9} ${tx + 16},${y}`} fill="currentColor" />
      <line x1={tx + 16} y1={y - 9} x2={tx + 16} y2={y + 9} {...wire} />
      <line x1={tx + 16} y1={y} x2={x + w} y2={y} {...wire} />
      {label && <text x={x + w / 2} y={y - 18} {...lbl}>{label}</text>}
    </g>
  );
}

/* ── LED (horizontal). Diode with emission arrows. ── */
export function LED_H({ x, y, w = 40, label }: { x: number; y: number; w?: number; label?: string }) {
  const lead = (w - 16) / 2;
  const tx = x + lead;
  return (
    <g>
      <line x1={x} y1={y} x2={tx} y2={y} {...wire} />
      <polygon points={`${tx},${y - 9} ${tx},${y + 9} ${tx + 16},${y}`} fill="currentColor" />
      <line x1={tx + 16} y1={y - 9} x2={tx + 16} y2={y + 9} {...wire} />
      <line x1={tx + 16} y1={y} x2={x + w} y2={y} {...wire} />
      {/* Emission arrows */}
      <line x1={tx + 12} y1={y - 16} x2={tx + 20} y2={y - 24} strokeWidth={1.5} stroke="currentColor" />
      <polygon points={`${tx + 20},${y - 24} ${tx + 16},${y - 22} ${tx + 18},${y - 18}`} fill="currentColor" />
      <line x1={tx + 18} y1={y - 12} x2={tx + 26} y2={y - 20} strokeWidth={1.5} stroke="currentColor" />
      <polygon points={`${tx + 26},${y - 20} ${tx + 22},${y - 18} ${tx + 24},${y - 14}`} fill="currentColor" />
      {label && <text x={x + w / 2} y={y - 26} {...lbl}>{label}</text>}
    </g>
  );
}

/* ── Meter circle with letter ── */
export function Meter({ cx, cy, r = 14, letter, label }: { cx: number; cy: number; r?: number; letter: string; label?: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} stroke="currentColor" strokeWidth={1.5} fill="none" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight={600} fill="currentColor">{letter}</text>
      {label && <text x={cx} y={cy + r + 14} textAnchor="middle" fontSize={10} fill="currentColor">{label}</text>}
    </g>
  );
}

/* ── Junction dot ── */
export function J({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={3} fill="currentColor" />;
}

/* ── Ground symbol ── */
export function Gnd({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 8} {...wire} />
      <line x1={x - 10} y1={y + 8} x2={x + 10} y2={y + 8} {...wire} />
      <line x1={x - 6} y1={y + 13} x2={x + 6} y2={y + 13} {...wire} />
      <line x1={x - 3} y1={y + 18} x2={x + 3} y2={y + 18} {...wire} />
    </g>
  );
}

/* ── SPST switch (horizontal) ── */
export function Sw_H({ x, y, w = 40, closed = false, label }: { x: number; y: number; w?: number; closed?: boolean; label?: string }) {
  const lead = (w - 20) / 2;
  const gx = x + lead;
  return (
    <g>
      <line x1={x} y1={y} x2={gx} y2={y} {...wire} />
      <circle cx={gx} cy={y} r={2.5} fill="currentColor" />
      <line x1={gx} y1={y} x2={gx + 20} y2={closed ? y : y - 14} {...wire} />
      <circle cx={gx + 20} cy={y} r={2.5} fill="currentColor" />
      <line x1={gx + 20} y1={y} x2={x + w} y2={y} {...wire} />
      {label && <text x={x + w / 2} y={y - 20} {...lbl}>{label}</text>}
    </g>
  );
}

/* ── Current arrow ── */
export function Arr({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label?: string }) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hl = 7;
  const ax = x2 - hl * Math.cos(angle - Math.PI / 6);
  const ay = y2 - hl * Math.sin(angle - Math.PI / 6);
  const bx = x2 - hl * Math.cos(angle + Math.PI / 6);
  const by = y2 - hl * Math.sin(angle + Math.PI / 6);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1.5} stroke="currentColor" />
      <polygon points={`${x2},${y2} ${ax},${ay} ${bx},${by}`} fill="currentColor" />
      {label && <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 6} {...lbl}>{label}</text>}
    </g>
  );
}

/* ── Text label ── */
export function L({ x, y, children, anchor = "middle" as const, size = 11 }: { x: number; y: number; children: React.ReactNode; anchor?: "start" | "middle" | "end"; size?: number }) {
  return <text x={x} y={y} textAnchor={anchor} fontSize={size} fill="currentColor">{children}</text>;
}
