/**
 * Phase 3: graph selector UX — real options, clear selection, honest empty state.
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GraphViewer from "../GraphViewer";
import { solveCircuit } from "../engine/circuitSolver";
import { selectAvailableGraphs } from "../engine/graphData";
import { ohmsLaw, voltageDivider12V } from "../engine/__tests__/circuitFixtures";
import type { SimulationResult } from "../engine/types";

describe("GraphViewer selector UX", () => {
  it("lists only available real presets and marks the active one", async () => {
    const user = userEvent.setup();
    const result = solveCircuit(ohmsLaw(5, 1000));
    expect(result.status).toBe("completed");
    const available = selectAvailableGraphs(result.graphs);

    render(<GraphViewer result={result} graphs={result.graphs} circuit={ohmsLaw(5, 1000)} />);

    const list = screen.getByRole("listbox", { name: /Available measurement graphs/i });
    const options = within(list).getAllByRole("option");
    expect(options).toHaveLength(available.length);
    expect(screen.queryByText(/no data/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Voltage Divider/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/RC \(/i)).not.toBeInTheDocument();

    const first = options[0];
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(first.className).toMatch(/sim-graph-preset-btn--active/);

    if (options.length > 1) {
      await user.click(options[1]);
      expect(options[1]).toHaveAttribute("aria-selected", "true");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
    }
  });

  it("uses user-facing designators in custom signal options", async () => {
    const user = userEvent.setup();
    const circuit = voltageDivider12V();
    const result = solveCircuit(circuit);
    render(<GraphViewer result={result} graphs={result.graphs} circuit={circuit} />);

    await user.click(screen.getByRole("button", { name: /Custom signals/i }));
    const y = screen.getByLabelText("Y-axis signal");
    expect(y).toHaveTextContent(/Voltage — R1|Current — R1|Power — R1/);
    expect(y).not.toHaveTextContent(/comp_/i);
  });

  it("shows an honest empty state without fake options", () => {
    const empty: SimulationResult = {
      status: "completed",
      measurements: {
        totalVoltage: Number.NaN,
        totalCurrent: Number.NaN,
        totalPower: Number.NaN,
        equivalentResistance: Number.NaN,
        componentMeasurements: [],
      },
      graphs: [],
    };
    render(<GraphViewer result={empty} graphs={[]} />);
    expect(
      screen.getByText(/Run a valid simulation to generate graph data/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("mode toggle exposes selected state", async () => {
    const user = userEvent.setup();
    const result = solveCircuit(ohmsLaw(5, 1000));
    render(<GraphViewer result={result} graphs={result.graphs} />);

    const plots = screen.getByRole("button", { name: /Measurement plots/i });
    const custom = screen.getByRole("button", { name: /Custom signals/i });
    expect(plots).toHaveAttribute("aria-pressed", "true");
    expect(custom).toHaveAttribute("aria-pressed", "false");

    await user.click(custom);
    expect(custom).toHaveAttribute("aria-pressed", "true");
    expect(plots).toHaveAttribute("aria-pressed", "false");
  });
});
