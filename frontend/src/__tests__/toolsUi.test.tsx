/**
 * UI regression: scientific calculator keypad + keyboard, unit converter state.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CalculatorPage from "../pages/tools/CalculatorPage";
import UnitConverterPage from "../pages/tools/UnitConverterPage";

function renderCalculator() {
  return render(
    <MemoryRouter>
      <CalculatorPage />
    </MemoryRouter>,
  );
}

function renderConverter() {
  return render(
    <MemoryRouter>
      <UnitConverterPage />
    </MemoryRouter>,
  );
}

describe("CalculatorPage UI", () => {
  it("evaluates keypad sin(90) in DEG and shows 1", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("button", { name: "sin" }));
    fireEvent.click(screen.getByRole("button", { name: "9" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "Equals" }));
    expect(document.querySelector(".calc-expression")?.textContent).toBe("1");
  });

  it("supports keyboard digits and Enter", () => {
    renderCalculator();
    fireEvent.keyDown(window, { key: "2" });
    fireEvent.keyDown(window, { key: "+" });
    fireEvent.keyDown(window, { key: "3" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(document.querySelector(".calc-expression")?.textContent).toBe("5");
  });

  it("shows structured Division by zero from the UI", () => {
    renderCalculator();
    fireEvent.keyDown(window, { key: "1" });
    fireEvent.keyDown(window, { key: "/" });
    fireEvent.keyDown(window, { key: "0" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(document.querySelector(".calc-expression")?.textContent).toMatch(
      /division by zero/i,
    );
  });

  it("toggles DEG / RAD", () => {
    renderCalculator();
    const rad = screen.getByRole("button", { name: "RAD" });
    fireEvent.click(rad);
    expect(rad).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/trig uses radians/i)).toBeInTheDocument();
  });
});

describe("UnitConverterPage UI", () => {
  it("updates To when From changes and category switch resets units", () => {
    renderConverter();
    const from = screen.getByLabelText("From") as HTMLInputElement;
    const to = screen.getByLabelText("To") as HTMLInputElement;

    fireEvent.change(from, { target: { value: "2" } });
    // default length mm → cm: 2 mm = 0.2 cm
    expect(to.value).toBe("0.2");

    fireEvent.click(screen.getByRole("tab", { name: "Voltage" }));
    expect((screen.getByLabelText("From") as HTMLInputElement).value).toBe("1");
    // µV → mV: 1 µV = 0.001 mV
    expect((screen.getByLabelText("To") as HTMLInputElement).value).toBe("0.001");
  });

  it("converts both directions", () => {
    renderConverter();
    fireEvent.click(screen.getByRole("tab", { name: "Voltage" }));
    // Switch from µV → V for clearer numbers
    fireEvent.change(screen.getByLabelText("From unit"), { target: { value: "v" } });
    fireEvent.change(screen.getByLabelText("To unit"), { target: { value: "mv" } });
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "1.5" } });
    expect((screen.getByLabelText("To") as HTMLInputElement).value).toBe("1500");

    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2500" } });
    expect((screen.getByLabelText("From") as HTMLInputElement).value).toBe("2.5");
  });
});
