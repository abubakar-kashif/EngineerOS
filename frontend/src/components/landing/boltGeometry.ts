/**
 * Single source of truth for the EngineerOS lightning-bolt mark.
 * The SVG logo and the intro particle field both read from this outline so the
 * converging particles resolve into exactly the logo silhouette.
 */
export const BOLT_VIEWBOX = { width: 100, height: 140 } as const;

/** Closed outline, clockwise, in BOLT_VIEWBOX units. */
export const BOLT_POLYGON: ReadonlyArray<readonly [number, number]> = [
  [58, 4],
  [20, 78],
  [46, 78],
  [38, 136],
  [82, 54],
  [54, 54],
];

export const BOLT_PATH = `M ${BOLT_POLYGON.map(([x, y]) => `${x} ${y}`).join(" L ")} Z`;

/**
 * Distribute `count` points evenly along the bolt outline (by edge length),
 * mapped into a box of `width` x `height` centred on (cx, cy).
 */
export function sampleBoltOutline(
  count: number,
  cx: number,
  cy: number,
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  const sx = width / BOLT_VIEWBOX.width;
  const sy = height / BOLT_VIEWBOX.height;
  const originX = cx - width / 2;
  const originY = cy - height / 2;

  const pts = BOLT_POLYGON.map(([x, y]) => ({
    x: originX + x * sx,
    y: originY + y * sy,
  }));

  const edges = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return { p, q, len: Math.hypot(q.x - p.x, q.y - p.y) };
  });
  const perimeter = edges.reduce((sum, e) => sum + e.len, 0);

  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i += 1) {
    let dist = (i / count) * perimeter;
    for (const edge of edges) {
      if (dist <= edge.len) {
        const t = edge.len === 0 ? 0 : dist / edge.len;
        out.push({
          x: edge.p.x + (edge.q.x - edge.p.x) * t,
          y: edge.p.y + (edge.q.y - edge.p.y) * t,
        });
        break;
      }
      dist -= edge.len;
    }
  }
  return out;
}
