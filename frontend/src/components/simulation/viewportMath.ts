/**
 * Shared screen ↔ simulation viewport math.
 * Placement, selection, wiring, pan, and zoom must all use these helpers
 * so transforms stay consistent after zoom/pan.
 */

export interface ViewportRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const VIEWPORT_SIZE_MIN = 200;
export const VIEWPORT_SIZE_MAX = 4000;

export function clampViewportSize(w: number, h: number): { w: number; h: number } {
  return {
    w: Math.max(VIEWPORT_SIZE_MIN, Math.min(VIEWPORT_SIZE_MAX, w)),
    h: Math.max(VIEWPORT_SIZE_MIN, Math.min(VIEWPORT_SIZE_MAX, h)),
  };
}

/**
 * Zoom the viewBox so (worldX, worldY) stays under the same screen fraction.
 * Used by cursor-centered wheel zoom and toolbar center zoom.
 */
export function zoomViewBoxAt(
  view: ViewportRect,
  factor: number,
  worldX: number,
  worldY: number,
): ViewportRect {
  const { w: newW, h: newH } = clampViewportSize(view.w * factor, view.h * factor);
  const fx = view.w === 0 ? 0.5 : (worldX - view.x) / view.w;
  const fy = view.h === 0 ? 0.5 : (worldY - view.y) / view.h;
  return {
    x: worldX - fx * newW,
    y: worldY - fy * newH,
    w: newW,
    h: newH,
  };
}

export function zoomViewBoxCenter(view: ViewportRect, factor: number): ViewportRect {
  return zoomViewBoxAt(view, factor, view.x + view.w / 2, view.y + view.h / 2);
}

/** Fallback screen → world when SVG CTM is unavailable (tests / edge cases). */
export function screenToWorldFromRect(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  view: ViewportRect,
): { x: number; y: number } {
  const scaleX = view.w / Math.max(rect.width, 1);
  const scaleY = view.h / Math.max(rect.height, 1);
  return {
    x: (clientX - rect.left) * scaleX + view.x,
    y: (clientY - rect.top) * scaleY + view.y,
  };
}

/**
 * Pan by a client-pixel delta using the same scale as screenToWorldFromRect.
 * Keeps placement / wiring aligned after pan + zoom.
 */
export function panViewBoxByClientDelta(
  view: ViewportRect,
  clientDx: number,
  clientDy: number,
  clientWidth: number,
  clientHeight: number,
): ViewportRect {
  const scaleX = view.w / Math.max(clientWidth, 1);
  const scaleY = view.h / Math.max(clientHeight, 1);
  return {
    ...view,
    x: view.x - clientDx * scaleX,
    y: view.y - clientDy * scaleY,
  };
}

/** World point under a fractional position (0–1) in the viewport. */
export function worldAtFraction(
  view: ViewportRect,
  fx: number,
  fy: number,
): { x: number; y: number } {
  return {
    x: view.x + fx * view.w,
    y: view.y + fy * view.h,
  };
}
