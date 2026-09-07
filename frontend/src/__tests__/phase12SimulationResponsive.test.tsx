/**
 * Phase 12 — simulation lab uses overlay drawers on tablet/phone.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "../App.css"), "utf8");

describe("Phase 12 simulation workspace responsive CSS", () => {
  it("keeps the desktop lab row and overlays panels below 1100px", () => {
    expect(css).toMatch(/\.sim2-layout--lab/);
    expect(css).toMatch(/\.sim2-sidebar--drawer/);
    expect(css).toMatch(/\.sim2-mentor-shell--drawer/);
    expect(css).toMatch(/\.sim2-drawer-backdrop/);
    expect(css).toMatch(/@media \(max-width: 1100px\)/);
    expect(css).toMatch(/@media \(max-width: 850px\)/);
    expect(css).toMatch(/@media \(max-width: 480px\)/);
  });

  it("does not stack the component rail above the canvas on compact widths", () => {
    expect(css).toMatch(/\.sim2-lab-row \{[\s\S]*?flex-direction:\s*row;/);
    expect(css).toMatch(/sim2-sidebar--drawer/);
    expect(css).not.toMatch(/zoom:\s*[0-9.]/);
  });

  it("keeps a usable canvas min-height on compact screens", () => {
    expect(css).toMatch(/min-height:\s*min\(56vh,\s*520px\)/);
    expect(css).toMatch(/sim2-mentor-mobile-link/);
  });
});
