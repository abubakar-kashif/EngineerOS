import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "../pages/Landing/LandingPage";
import { INTRO_SESSION_KEY } from "../components/landing/landingMotion";
import { menuGroups } from "../components/layout/navConfig";

/** jsdom implements neither IntersectionObserver nor canvas 2D contexts. */
beforeAll(() => {
  class StubObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver = StubObserver as unknown as typeof IntersectionObserver;
});

function setReducedMotion(reduced: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  setReducedMotion(false);
});

describe("public landing page", () => {
  it("presents a pre-login navbar instead of the app shell", () => {
    renderLanding();

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Login" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: "Get Started" })[0]).toHaveAttribute(
      "href",
      "/register",
    );

    // No authenticated sidebar destinations leak onto the marketing page.
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("renders the hero proposition and both calls to action", () => {
    renderLanding();

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Learn Electrical Engineering by Building It.");
    expect(
      screen.getByText(/EngineerOS connects theory with real understanding/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Get Started Free/ })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(screen.getByRole("link", { name: /See How It Works/ })).toBeInTheDocument();
    expect(screen.getByText("No installation")).toBeInTheDocument();
  });

  it("renders every feature and every workflow step", () => {
    renderLanding();

    expect(
      screen.getByRole("heading", { name: "Everything you need to understand circuits" }),
    ).toBeInTheDocument();
    for (const feature of [
      "Interactive Experiments",
      "Circuit Simulation",
      "Measurements & Analysis",
      "AI Mentor",
      "Quizzes & Reports",
    ]) {
      expect(screen.getByRole("heading", { name: feature })).toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: "How EngineerOS works" })).toBeInTheDocument();
    for (const step of ["Learn", "Experiment", "Build", "Simulate", "Analyze", "Understand"]) {
      expect(screen.getByRole("heading", { name: step })).toBeInTheDocument();
    }
  });

  it("renders the mentor spotlight, stats, final CTA and footer", () => {
    renderLanding();

    expect(screen.getByText("Your")).toBeInTheDocument();
    expect(screen.getByText("AI Engineering Mentor")).toBeInTheDocument();
    expect(screen.getByText("Available 24/7")).toBeInTheDocument();

    expect(screen.getAllByText("Experiments").length).toBeGreaterThan(0);
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
    expect(screen.getByText("Real-time")).toBeInTheDocument();
    expect(screen.getByText("Components")).toBeInTheDocument();
    // Inflated marketing stats must not appear.
    expect(screen.queryByText("50+")).not.toBeInTheDocument();
    expect(screen.queryByText("1000+")).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Ready to start your engineering journey?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Get Started Now/ })).toHaveAttribute(
      "href",
      "/register",
    );

    expect(
      screen.getByText("The complete electrical engineering learning platform."),
    ).toBeInTheDocument();
    expect(screen.getByText("© 2026 EngineerOS. All rights reserved.")).toBeInTheDocument();
  });

  it("does not omit the section anchors the navbar scrolls to", () => {
    const { container } = renderLanding();

    for (const id of ["product", "features", "how-it-works", "about"]) {
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });
});

describe("landing intro animation", () => {
  it("plays the full intro on the first visit of a session and records it", () => {
    renderLanding();

    expect(screen.getByRole("button", { name: "Skip intro" })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(INTRO_SESSION_KEY)).toBe("1");
  });

  it("skips the full intro on repeat visits within the same session", () => {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "1");
    renderLanding();

    expect(screen.queryByRole("button", { name: "Skip intro" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("skips the intro entirely when reduced motion is preferred", () => {
    setReducedMotion(true);
    renderLanding();

    expect(screen.queryByRole("button", { name: "Skip intro" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("dismisses the intro when the skip control is used", async () => {
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole("button", { name: "Skip intro" }));

    await waitFor(
      () => expect(screen.queryByRole("button", { name: "Skip intro" })).not.toBeInTheDocument(),
      { timeout: 3000 },
    );
  });
});

describe("app home route", () => {
  it("moves the authenticated Home destination off the landing route", () => {
    const paths = menuGroups.flatMap((group) => group.items.map((item) => item.path));
    expect(paths).toContain("/home");
    expect(paths).not.toContain("/");
  });
});
