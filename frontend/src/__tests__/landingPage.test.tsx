/**
 * Phase 2 landing redesign — hero structure and section presence.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import HeroSection from "../components/home/HeroSection";
import HowItWorks from "../components/home/HowItWorks";
import FinalCTA from "../components/home/FinalCTA";
import SimulationPreview from "../components/home/SimulationPreview";
import StatsProof from "../components/home/StatsProof";

vi.mock("../services/experimentService", () => ({
  getExperiments: vi.fn(async () => ({ items: [] })),
}));

const css = readFileSync(resolve(__dirname, "../App.css"), "utf8");

describe("Landing hero redesign", () => {
  it("renders a centered EngineerOS intro without a hero simulation mockup", () => {
    render(
      <MemoryRouter>
        <HeroSection />
      </MemoryRouter>,
    );

    expect(screen.getByText("EngineerOS")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Learn Electrical Engineering/i,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/by Building It/i);
    expect(screen.getByRole("link", { name: /Start Learning/i })).toHaveAttribute(
      "href",
      "/experiments",
    );
    expect(screen.getByRole("link", { name: /Explore Experiments/i })).toHaveAttribute(
      "href",
      "/experiments",
    );
    expect(document.querySelector(".home-hero-visual")).toBeNull();
    expect(document.querySelector(".home-hero-preview")).toBeNull();
    expect(document.querySelector(".home-hero-circuit")).toBeNull();
  });

  it("keeps hero CSS centered and mockup-free", () => {
    expect(css).toMatch(/\.home-hero-inner--centered/);
    expect(css).toMatch(/\.home-hero--intro/);
    expect(css).not.toMatch(/\.home-hero-inner\s*\{[^}]*grid-template-columns:\s*1\.1fr/);
  });
});

describe("Landing major sections", () => {
  it("renders How It Works steps", () => {
    render(
      <MemoryRouter>
        <HowItWorks />
      </MemoryRouter>,
    );
    expect(screen.getByText("Learn")).toBeInTheDocument();
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Simulate")).toBeInTheDocument();
    expect(screen.getByText("Understand")).toBeInTheDocument();
  });

  it("renders simulation showcase after the hero story", () => {
    render(
      <MemoryRouter>
        <SimulationPreview />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Here's where you build it/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Workspace/i })).toHaveAttribute(
      "href",
      "/simulation",
    );
  });

  it("renders real platform stats and CTA with Start Learning", () => {
    render(
      <MemoryRouter>
        <StatsProof />
        <FinalCTA />
      </MemoryRouter>,
    );
    expect(screen.getByText("10+")).toBeInTheDocument();
    expect(screen.getByText(/Ready to build your understanding/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Start Learning/i }).length).toBeGreaterThan(0);
  });
});
