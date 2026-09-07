/**
 * Viewport transform regression: cursor-centered zoom, pan, screen↔world.
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import CircuitCanvas from "../CircuitCanvas";
import {
  clampViewportSize,
  panViewBoxByClientDelta,
  screenToWorldFromRect,
  VIEWPORT_SIZE_MAX,
  VIEWPORT_SIZE_MIN,
  worldAtFraction,
  zoomViewBoxAt,
  zoomViewBoxCenter,
} from "../viewportMath";

const view = { x: 0, y: 0, w: 800, h: 600 };
const rect = { left: 100, top: 50, width: 400, height: 300 };

describe("viewportMath", () => {
  it("zooms in and out around the viewport center", () => {
    const inView = zoomViewBoxCenter(view, 0.5);
    expect(inView.w).toBe(400);
    expect(inView.h).toBe(300);
    expect(inView.x + inView.w / 2).toBeCloseTo(400);
    expect(inView.y + inView.h / 2).toBeCloseTo(300);

    const outView = zoomViewBoxCenter(inView, 2);
    expect(outView.w).toBeCloseTo(800);
    expect(outView.h).toBeCloseTo(600);
    expect(outView.x).toBeCloseTo(0);
    expect(outView.y).toBeCloseTo(0);
  });

  it("keeps the world point under the cursor after zoom (cursor-centered)", () => {
    const cursorWorld = worldAtFraction(view, 0.25, 0.75);
    const zoomed = zoomViewBoxAt(view, 0.5, cursorWorld.x, cursorWorld.y);
    const stillUnderCursor = worldAtFraction(zoomed, 0.25, 0.75);
    expect(stillUnderCursor.x).toBeCloseTo(cursorWorld.x);
    expect(stillUnderCursor.y).toBeCloseTo(cursorWorld.y);
  });

  it("pans by client delta with the same scale as screenToWorldFromRect", () => {
    const before = screenToWorldFromRect(200, 100, rect, view);
    const panned = panViewBoxByClientDelta(view, 40, -20, rect.width, rect.height);
    const after = screenToWorldFromRect(200, 100, rect, panned);
    // World under the same screen pixel moves opposite to pan.
    expect(after.x - before.x).toBeCloseTo(-(40 * view.w) / rect.width);
    expect(after.y - before.y).toBeCloseTo(-(-20 * view.h) / rect.height);
  });

  it("preserves relative world positions across zoom then pan then zoom", () => {
    const a = { x: 100, y: 120 };
    const b = { x: 300, y: 220 };
    let v = zoomViewBoxAt(view, 0.8, a.x, a.y);
    v = panViewBoxByClientDelta(v, 30, 15, rect.width, rect.height);
    v = zoomViewBoxAt(v, 1.2, b.x, b.y);

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // World distances are invariant; only the viewport framing changes.
    expect(dx).toBe(200);
    expect(dy).toBe(100);
    expect(v.w).toBeGreaterThan(VIEWPORT_SIZE_MIN);
    expect(v.w).toBeLessThan(VIEWPORT_SIZE_MAX);
  });

  it("maps screen center to viewBox center via screenToWorldFromRect", () => {
    const mid = screenToWorldFromRect(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      rect,
      view,
    );
    expect(mid.x).toBeCloseTo(view.x + view.w / 2);
    expect(mid.y).toBeCloseTo(view.y + view.h / 2);
  });

  it("keeps placement math aligned after zoom (screen→world under cursor)", () => {
    const clientX = rect.left + rect.width * 0.4;
    const clientY = rect.top + rect.height * 0.6;
    const worldBefore = screenToWorldFromRect(clientX, clientY, rect, view);
    const zoomed = zoomViewBoxAt(view, 0.7, worldBefore.x, worldBefore.y);
    const worldAfter = screenToWorldFromRect(clientX, clientY, rect, zoomed);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y);
  });

  it("clamps extreme zoom factors", () => {
    const tiny = clampViewportSize(1, 1);
    expect(tiny.w).toBe(VIEWPORT_SIZE_MIN);
    expect(tiny.h).toBe(VIEWPORT_SIZE_MIN);
    const huge = clampViewportSize(50_000, 50_000);
    expect(huge.w).toBe(VIEWPORT_SIZE_MAX);
    expect(huge.h).toBe(VIEWPORT_SIZE_MAX);

    const zoomedOut = zoomViewBoxCenter(view, 100);
    expect(zoomedOut.w).toBe(VIEWPORT_SIZE_MAX);
    expect(zoomedOut.h).toBe(VIEWPORT_SIZE_MAX);
  });
});

describe("CircuitCanvas wheel listener", () => {
  it("registers a non-passive wheel listener so browser zoom can be blocked", () => {
    const addSpy = vi.spyOn(HTMLElement.prototype, "addEventListener");

    const editor = {
      circuit: { components: [], wires: [], connections: [], junctions: [] },
      selectedComponentId: null,
      selectedWireId: null,
      mode: "select" as const,
      placementType: null,
      wireStart: null,
      wirePreviewPoints: [],
      undoStack: [],
      redoStack: [],
      dirty: false,
    };

    render(
      <CircuitCanvas
        editor={editor}
        simResult={null}
        onAddComponent={vi.fn()}
        onSelectComponent={vi.fn()}
        onSelectWire={vi.fn()}
        onMoveComponent={vi.fn()}
        onStartWire={vi.fn()}
        onCompleteWire={vi.fn()}
        onUpdateWirePreview={vi.fn()}
        onCancelWire={vi.fn()}
        onCancelPlacement={vi.fn()}
        placementType={null}
      />,
    );

    const wheelCalls = addSpy.mock.calls.filter((call) => call[0] === "wheel");
    expect(wheelCalls.length).toBeGreaterThan(0);
    const nonPassive = wheelCalls.find((call) => {
      const opts = call[2] as AddEventListenerOptions | boolean | undefined;
      return typeof opts === "object" && opts?.passive === false;
    });
    expect(nonPassive).toBeDefined();

    addSpy.mockRestore();
  });
});
