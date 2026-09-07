/**
 * Phase 11 — shared responsive website layout (not simulation lab).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import MobileNav from "../components/layout/MobileNav";
import { menuGroups } from "../components/layout/navConfig";

const css = readFileSync(resolve(__dirname, "../App.css"), "utf8");
const globals = readFileSync(resolve(__dirname, "../styles/globals.css"), "utf8");
const tokens = readFileSync(resolve(__dirname, "../styles/tokens.css"), "utf8");

describe("Phase 11 shared layout tokens", () => {
  it("defines reusable sidebar and page padding tokens", () => {
    expect(tokens).toMatch(/--layout-sidebar-width:\s*236px/);
    expect(tokens).toMatch(/--layout-navbar-height/);
    expect(tokens).toMatch(/--layout-page-pad-x/);
    expect(css).toMatch(/\.app-layout[\s\S]*--layout-sidebar-width:\s*236px/);
    expect(css).toMatch(/width:\s*var\(--layout-sidebar-width\)/);
    expect(css).toMatch(/margin-left:\s*var\(--layout-sidebar-width\)/);
    expect(css).toMatch(/width:\s*calc\(100% - var\(--layout-sidebar-width\)\)/);
  });

  it("clips page overflow instead of shrinking the app with zoom", () => {
    expect(globals).toMatch(/overflow-x:\s*clip/);
    expect(css).not.toMatch(/zoom:\s*[0-9.]/);
  });

  it("hides the desktop sidebar at tablet/phone and uses overlay nav", () => {
    expect(css).toMatch(/@media \(max-width: 768px\)/);
    expect(css).toMatch(/@media \(max-width: 640px\)/);
    expect(css).toMatch(/\.sidebar \{ display: none; \}/);
    expect(css).toMatch(/\.mobile-menu-btn \{ display: flex; \}/);
  });
});

describe("Phase 11 mobile navigation", () => {
  it("exposes the same destinations as the desktop sidebar", () => {
    const paths = menuGroups.flatMap((g) => g.items.map((i) => i.path));
    expect(paths).toEqual(
      expect.arrayContaining([
        "/home",
        "/dashboard",
        "/experiments",
        "/quiz",
        "/reports",
        "/resources",
        "/simulation",
        "/mentor",
        "/tools",
        "/settings",
        "/about",
      ]),
    );

    render(
      <MemoryRouter>
        <MobileNav open onClose={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("dialog", { name: /navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /quiz/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resources/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^home$/i })).toBeInTheDocument();
  });
});
