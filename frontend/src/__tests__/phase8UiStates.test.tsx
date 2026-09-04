/**
 * Phase 8 — lab layout, toolbar UI states, empty/error a11y.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SimToolbar from "../components/simulation/SimToolbar";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import EmptyCanvasState from "../components/simulation/EmptyCanvasState";

const cssPath = resolve(__dirname, "../App.css");
const css = readFileSync(cssPath, "utf8");

describe("Phase 8 simulation lab layout CSS", () => {
  it("defines full-width measurements under the three lab columns", () => {
    expect(css).toMatch(/grid-template-areas:\s*"sidebar workspace mentor"/);
    expect(css).toMatch(/"analysis analysis analysis"/);
    expect(css).toMatch(/\.sim2-layout--lab > \.sim2-analysis \{ grid-area: analysis; \}/);
  });

  it("adapts without browser zoom hacks", () => {
    expect(css).not.toMatch(/zoom:\s*[0-9.]/);
    expect(css).not.toMatch(/user-scalable\s*=\s*no/i);
    expect(css).toMatch(/@media \(max-width: 1100px\)/);
    expect(css).toMatch(/@media \(max-width: 850px\)/);
    expect(css).toMatch(/@media \(max-width: 480px\)/);
    expect(css).toMatch(/Open AI Mentor|sim2-mentor-mobile-link/);
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
    expect(css).toMatch(/\.sim2-status-dot--pulse/);
  });
});

describe("Phase 8 toolbar / empty / error states", () => {
  const toolbarProps = {
    status: "idle" as const,
    canRun: true,
    canUndo: false,
    canRedo: false,
    dirty: false,
    fullscreen: false,
    onRun: vi.fn(),
    onStop: vi.fn(),
    onReset: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onClear: vi.fn(),
    onSave: vi.fn(),
    onOpen: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFit: vi.fn(),
    onResetView: vi.fn(),
    onToggleFullscreen: vi.fn(),
  };

  it("shows running, saved, unsaved, and disabled run states", () => {
    const { rerender } = render(<SimToolbar {...toolbarProps} status="running" />);
    expect(screen.getByRole("status")).toHaveTextContent("Running…");
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();

    rerender(<SimToolbar {...toolbarProps} dirty saveStatus="idle" />);
    expect(screen.getByText(/unsaved/i)).toBeInTheDocument();

    rerender(<SimToolbar {...toolbarProps} saveStatus="saving" />);
    expect(screen.getByText("Saving…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    rerender(<SimToolbar {...toolbarProps} saveStatus="saved" />);
    expect(screen.getByText("Saved")).toBeInTheDocument();

    rerender(<SimToolbar {...toolbarProps} canRun={false} />);
    expect(screen.getByRole("button", { name: /run/i })).toBeDisabled();
  });

  it("renders empty and error states with retry", () => {
    const retry = vi.fn();
    render(
      <EmptyState
        title="No conversations yet"
        description="Start a new conversation with EngineerOS Mentor."
      />,
    );
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();

    render(
      <ErrorState
        title="Could not load"
        description="Please try again."
        retryAction={retry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Could not load");
    screen.getByRole("button", { name: /try again/i }).click();
    expect(retry).toHaveBeenCalled();
  });

  it("exposes the empty canvas guidance as a status region", () => {
    render(<EmptyCanvasState />);
    expect(screen.getByRole("status")).toHaveTextContent(/Build Your Circuit/i);
  });
});
