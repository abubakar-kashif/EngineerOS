/**
 * Wire geometry + electrical net helpers for Proteus-like wiring.
 * Visual geometry (points/junctions) is separate from solver topology
 * (terminal connections derived from net membership).
 */
import type {
  CircuitJunction,
  EditorCircuit,
  WireConnection,
  WireEnd,
  WireSegment,
} from "./editorTypes";
import { getTerminalWorldPosition } from "./editorUtils";

export const TERMINAL_SNAP_DISTANCE = 16;
export const WIRE_HIT_DISTANCE = 10;
export const ENDPOINT_HIT_DISTANCE = 12;

export interface Point {
  x: number;
  y: number;
}

export interface WireHit {
  wireId: string;
  point: Point;
  segmentIndex: number;
  t: number;
  distance: number;
}

export function dist(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Nearest point on segment A→B to P. */
export function nearestOnSegment(
  p: Point,
  a: Point,
  b: Point,
): { point: Point; t: number; distance: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-9) {
    return { point: { ...a }, t: 0, distance: dist(p, a) };
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  const point = { x: a.x + t * dx, y: a.y + t * dy };
  return { point, t, distance: dist(p, point) };
}

export function nearestOnPolyline(
  p: Point,
  points: Point[],
): { point: Point; segmentIndex: number; t: number; distance: number } | null {
  if (points.length < 2) return null;
  let best: { point: Point; segmentIndex: number; t: number; distance: number } | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    const hit = nearestOnSegment(p, points[i], points[i + 1]);
    if (!best || hit.distance < best.distance) {
      best = { point: hit.point, segmentIndex: i, t: hit.t, distance: hit.distance };
    }
  }
  return best;
}

export function hitTestWire(
  p: Point,
  wires: WireSegment[],
  maxDistance = WIRE_HIT_DISTANCE,
): WireHit | null {
  let best: WireHit | null = null;
  for (const wire of wires) {
    const hit = nearestOnPolyline(p, wire.points);
    if (!hit || hit.distance > maxDistance) continue;
    if (!best || hit.distance < best.distance) {
      best = {
        wireId: wire.id,
        point: hit.point,
        segmentIndex: hit.segmentIndex,
        t: hit.t,
        distance: hit.distance,
      };
    }
  }
  return best;
}

export function splitPolylineAt(
  points: Point[],
  segmentIndex: number,
  t: number,
  at: Point,
): { before: Point[]; after: Point[] } {
  const before = points.slice(0, segmentIndex + 1);
  const after = points.slice(segmentIndex + 1);
  const needInsert =
    dist(before[before.length - 1], at) > 0.5 &&
    (after.length === 0 || dist(after[0], at) > 0.5);
  if (needInsert || t > 0.02) {
    if (dist(before[before.length - 1], at) > 0.5) before.push({ ...at });
  }
  const afterStart = [{ ...at }, ...after.filter((p) => dist(p, at) > 0.5)];
  return { before, after: afterStart };
}

/** Resolve world position of a wire end. */
export function resolveWireEndPosition(
  end: WireEnd,
  circuit: Pick<EditorCircuit, "components" | "junctions">,
): Point | null {
  if (end.kind === "terminal") {
    const comp = circuit.components.find((c) => c.id === end.componentId);
    if (!comp) return null;
    return getTerminalWorldPosition(comp, end.terminalId);
  }
  const j = (circuit.junctions ?? []).find((jj) => jj.id === end.junctionId);
  return j ? { x: j.x, y: j.y } : null;
}

/** Collect terminal refs ("comp:term") for a net. */
export function terminalsOnNet(circuit: EditorCircuit, netId: string): string[] {
  const out = new Set<string>();
  for (const wire of circuit.wires) {
    if (wire.netId !== netId) continue;
    for (const end of [wire.a, wire.b]) {
      if (end?.kind === "terminal") {
        out.add(`${end.componentId}:${end.terminalId}`);
      }
    }
  }
  return [...out];
}

/**
 * Derive pairwise terminal connections from net membership (star from hub).
 * Geometry / junctions never go to the solver — only these edges do.
 */
export function rebuildConnections(circuit: EditorCircuit): WireConnection[] {
  const byNet = new Map<string, Set<string>>();
  for (const wire of circuit.wires) {
    const netId = wire.netId ?? wire.id;
    if (!byNet.has(netId)) byNet.set(netId, new Set());
    const set = byNet.get(netId)!;
    for (const end of [wire.a, wire.b]) {
      if (end?.kind === "terminal") {
        set.add(`${end.componentId}:${end.terminalId}`);
      }
    }
  }
  const connections: WireConnection[] = [];
  for (const terms of byNet.values()) {
    const list = [...terms];
    if (list.length < 2) continue;
    const hub = list[0];
    for (let i = 1; i < list.length; i++) {
      connections.push({ from: hub, to: list[i] });
    }
  }
  return connections;
}

/** Ensure legacy wires/junctions have netId + ends derived from parallel connections. */
export function normalizeEditorCircuit(circuit: EditorCircuit): EditorCircuit {
  const legacyJunctions = circuit.junctions ?? [];
  const junctions: CircuitJunction[] = legacyJunctions.map((j, i) => {
    if ("id" in j && typeof (j as CircuitJunction).id === "string") {
      const jj = j as CircuitJunction;
      return {
        id: jj.id,
        x: jj.x,
        y: jj.y,
        netId: jj.netId ?? `net_j_${jj.id}`,
      };
    }
    return {
      id: `junc_mig_${i}`,
      x: (j as Point).x,
      y: (j as Point).y,
      netId: `net_mig_j_${i}`,
    };
  });

  const wires: WireSegment[] = circuit.wires.map((wire, index) => {
    if (wire.netId && wire.a && wire.b) {
      return { ...wire, netId: wire.netId, a: wire.a, b: wire.b, points: [...wire.points] };
    }
    const conn = circuit.connections[index];
    let a: WireEnd | undefined = wire.a;
    let b: WireEnd | undefined = wire.b;
    if (conn) {
      const [fc, ft] = conn.from.split(":");
      const [tc, tt] = (conn.to || "").split(":");
      if (fc && ft) a = a ?? { kind: "terminal", componentId: fc, terminalId: ft };
      if (tc && tt) b = b ?? { kind: "terminal", componentId: tc, terminalId: tt };
    }
    // Fallback free ends so geometry still loads
    const start = wire.points[0] ?? { x: 0, y: 0 };
    const end = wire.points[wire.points.length - 1] ?? start;
    if (!a) {
      const jid = uid("junc");
      junctions.push({ id: jid, x: start.x, y: start.y, netId: wire.netId ?? `net_${wire.id}` });
      a = { kind: "junction", junctionId: jid };
    }
    if (!b) {
      const jid = uid("junc");
      junctions.push({
        id: jid,
        x: end.x,
        y: end.y,
        netId: wire.netId ?? `net_${wire.id}`,
      });
      b = { kind: "junction", junctionId: jid };
    }
    return {
      ...wire,
      netId: wire.netId ?? `net_${wire.id}`,
      a,
      b,
      points: wire.points.length >= 2 ? [...wire.points] : [start, end],
    };
  });

  const normalized: EditorCircuit = {
    ...circuit,
    wires,
    junctions,
    connections: circuit.connections ?? [],
  };
  normalized.connections = rebuildConnections(normalized);
  return normalized;
}

export function mergeNetIds(
  circuit: EditorCircuit,
  keepNetId: string,
  dropNetId: string,
): EditorCircuit {
  if (keepNetId === dropNetId) return circuit;
  return {
    ...circuit,
    wires: circuit.wires.map((w) =>
      w.netId === dropNetId ? { ...w, netId: keepNetId } : w,
    ),
    junctions: (circuit.junctions ?? []).map((j) =>
      j.netId === dropNetId ? { ...j, netId: keepNetId } : j,
    ),
  };
}

/**
 * Split an existing wire at a point and insert a junction on its net.
 * Returns updated circuit pieces (caller assigns).
 */
export function splitWireAtPoint(
  circuit: EditorCircuit,
  wireId: string,
  at: Point,
): { circuit: EditorCircuit; junctionId: string; netId: string } | null {
  const wire = circuit.wires.find((w) => w.id === wireId);
  if (!wire || !wire.a || !wire.b) return null;
  const hit = nearestOnPolyline(at, wire.points);
  if (!hit) return null;

  const netId = wire.netId;
  const junctionId = uid("junc");
  const junction: CircuitJunction = { id: junctionId, x: hit.point.x, y: hit.point.y, netId };
  const { before, after } = splitPolylineAt(
    wire.points,
    hit.segmentIndex,
    hit.t,
    hit.point,
  );

  const left: WireSegment = {
    id: uid("wire"),
    netId,
    points: before.length >= 2 ? before : [before[0] ?? hit.point, hit.point],
    a: wire.a,
    b: { kind: "junction", junctionId },
  };
  const right: WireSegment = {
    id: uid("wire"),
    netId,
    points: after.length >= 2 ? after : [hit.point, after[after.length - 1] ?? hit.point],
    a: { kind: "junction", junctionId },
    b: wire.b,
  };

  const wires = circuit.wires.filter((w) => w.id !== wireId).concat([left, right]);
  const next: EditorCircuit = {
    ...circuit,
    wires,
    junctions: [...(circuit.junctions ?? []), junction],
  };
  next.connections = rebuildConnections(next);
  return { circuit: next, junctionId, netId };
}

export function findNearestTerminal(
  circuit: EditorCircuit,
  p: Point,
  maxDistance = TERMINAL_SNAP_DISTANCE,
): { componentId: string; terminalId: string; point: Point; distance: number } | null {
  let best: { componentId: string; terminalId: string; point: Point; distance: number } | null =
    null;
  for (const comp of circuit.components) {
    for (const termId of comp.terminals) {
      const point = getTerminalWorldPosition(comp, termId);
      const d = dist(p, point);
      if (d > maxDistance) continue;
      if (!best || d < best.distance) {
        best = { componentId: comp.id, terminalId: termId, point, distance: d };
      }
    }
  }
  return best;
}

/** Snap cursor for wiring preview: terminal > wire > raw. */
export function snapWiringCursor(
  circuit: EditorCircuit,
  p: Point,
  opts?: { excludeWireId?: string },
): { point: Point; kind: "terminal" | "wire" | "none"; terminal?: { componentId: string; terminalId: string }; wireHit?: WireHit } {
  const term = findNearestTerminal(circuit, p);
  if (term) {
    return {
      point: term.point,
      kind: "terminal",
      terminal: { componentId: term.componentId, terminalId: term.terminalId },
    };
  }
  const wires = opts?.excludeWireId
    ? circuit.wires.filter((w) => w.id !== opts.excludeWireId)
    : circuit.wires;
  const wireHit = hitTestWire(p, wires, WIRE_HIT_DISTANCE);
  if (wireHit) {
    return { point: wireHit.point, kind: "wire", wireHit };
  }
  return { point: p, kind: "none" };
}

/** Update wire endpoint positions attached to a moved/rotated component; keep midpoints. */
export function retargetWiresForComponent(
  circuit: EditorCircuit,
  componentId: string,
): WireSegment[] {
  return circuit.wires.map((wire) => {
    if (!wire.a || !wire.b || wire.points.length < 2) return wire;
    const points = wire.points.map((pt) => ({ ...pt }));
    let changed = false;
    if (wire.a.kind === "terminal" && wire.a.componentId === componentId) {
      const pos = resolveWireEndPosition(wire.a, circuit);
      if (pos) {
        points[0] = pos;
        changed = true;
      }
    }
    if (wire.b.kind === "terminal" && wire.b.componentId === componentId) {
      const pos = resolveWireEndPosition(wire.b, circuit);
      if (pos) {
        points[points.length - 1] = pos;
        changed = true;
      }
    }
    return changed ? { ...wire, points } : wire;
  });
}

/** Move a junction and every wire endpoint attached to it. */
export function moveJunction(
  circuit: EditorCircuit,
  junctionId: string,
  x: number,
  y: number,
): EditorCircuit {
  const junctions = (circuit.junctions ?? []).map((j) =>
    j.id === junctionId ? { ...j, x, y } : j,
  );
  const wires = circuit.wires.map((wire) => {
    if (!wire.a || !wire.b) return wire;
    const points = wire.points.map((pt) => ({ ...pt }));
    let changed = false;
    if (wire.a.kind === "junction" && wire.a.junctionId === junctionId) {
      points[0] = { x, y };
      changed = true;
    }
    if (wire.b.kind === "junction" && wire.b.junctionId === junctionId) {
      points[points.length - 1] = { x, y };
      changed = true;
    }
    return changed ? { ...wire, points } : wire;
  });
  return { ...circuit, junctions, wires };
}

/** Translate an interior vertex (or insert one) for reshape. */
export function reshapeWireAt(
  wire: WireSegment,
  cursor: Point,
  mode: "drag-vertex" | "insert",
  vertexIndex?: number,
): WireSegment {
  const points = wire.points.map((p) => ({ ...p }));
  if (mode === "drag-vertex" && vertexIndex != null && vertexIndex > 0 && vertexIndex < points.length - 1) {
    points[vertexIndex] = { ...cursor };
    return { ...wire, points };
  }
  const hit = nearestOnPolyline(cursor, points);
  if (!hit) return wire;
  // Prefer existing vertex near hit
  for (let i = 1; i < points.length - 1; i++) {
    if (dist(points[i], hit.point) < ENDPOINT_HIT_DISTANCE) {
      points[i] = { ...cursor };
      return { ...wire, points };
    }
  }
  // Insert new elbow
  const { before, after } = splitPolylineAt(points, hit.segmentIndex, hit.t, cursor);
  const merged = [...before];
  if (after.length > 1) merged.push(...after.slice(1));
  else if (after.length === 1 && dist(merged[merged.length - 1], after[0]) > 0.5) {
    merged.push(after[0]);
  }
  return { ...wire, points: merged.length >= 2 ? merged : points };
}

export function pruneOrphanJunctions(circuit: EditorCircuit): EditorCircuit {
  const used = new Set<string>();
  for (const wire of circuit.wires) {
    for (const end of [wire.a, wire.b]) {
      if (end?.kind === "junction") used.add(end.junctionId);
    }
  }
  return {
    ...circuit,
    junctions: (circuit.junctions ?? []).filter((j) => used.has(j.id)),
  };
}
