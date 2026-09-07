import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import MarkdownLite, { MathText } from "../components/chat/MarkdownLite";
import QuestionCard from "../components/quiz/QuestionCard";
import QuizReview from "../components/quiz/QuizReview";
import type { QuestionFeedback, QuizQuestion } from "../types/quiz";

function visibleText(container: HTMLElement): string {
  const mathml = container.querySelectorAll(".katex-mathml");
  mathml.forEach((node) => node.remove());
  return container.textContent ?? "";
}

describe("MarkdownLite mathematical rendering", () => {
  it("renders $V = I \\times R$ with KaTeX and no raw delimiters", () => {
    const { container } = render(<MarkdownLite content={"$V = I \\times R$"} />);
    expect(container.querySelector(".katex")).toBeTruthy();
    const text = visibleText(container);
    expect(text).not.toContain("$");
    expect(text).not.toContain("\\times");
    expect(text).toMatch(/V/);
    expect(text).toMatch(/I/);
    expect(text).toMatch(/R/);
  });

  it("renders $I = \\frac{V}{R}$ as a fraction without raw TeX", () => {
    const { container } = render(<MarkdownLite content={"$I = \\frac{V}{R}$"} />);
    expect(container.querySelector(".katex")).toBeTruthy();
    const text = visibleText(container);
    expect(text).not.toContain("\\frac");
    expect(text).not.toContain("{V}");
    expect(text).not.toContain("$");
  });

  it("renders undelimited \\frac{V}{R}", () => {
    const { container } = render(<MarkdownLite content={"I = \\frac{V}{R}"} />);
    expect(container.querySelector(".katex")).toBeTruthy();
    expect(visibleText(container)).not.toContain("\\frac");
  });

  it("renders P = VI and R = V/I as ordinary engineering text", () => {
    const { container } = render(
      <MarkdownLite content={"Ohm power is P = VI. Resistance is R = V/I."} />,
    );
    expect(visibleText(container)).toContain("P = VI");
    expect(visibleText(container)).toContain("R = V/I");
    expect(visibleText(container)).not.toContain("$");
  });

  it("keeps units and English prose", () => {
    const { container } = render(
      <MarkdownLite content={"The source is 5 V and the current is 5 mA through 1 kΩ."} />,
    );
    const text = visibleText(container);
    expect(text).toContain("5 V");
    expect(text).toContain("5 mA");
    expect(text).toContain("1 kΩ");
    expect(text).toContain("The source is");
  });

  it("renders Greek and engineering symbols without leftover TeX", () => {
    const { container } = render(
      <MarkdownLite content={"$\\Delta V$ across $1\\,\\Omega$ and $\\mu$A."} />,
    );
    expect(container.querySelectorAll(".katex").length).toBeGreaterThan(1);
    const text = visibleText(container);
    expect(text).not.toContain("\\Delta");
    expect(text).not.toContain("\\Omega");
    expect(text).not.toContain("\\mu");
  });

  it("preserves fenced code with raw LaTeX inside", () => {
    const { container } = render(
      <MarkdownLite content={"Use:\n```\nI = \\frac{V}{R}\n```"} />,
    );
    const pre = container.querySelector("pre.md-code-block");
    expect(pre).toBeTruthy();
    expect(pre?.textContent).toContain("\\frac{V}{R}");
    expect(pre?.querySelector(".katex")).toBeNull();
  });

  it("preserves inline code", () => {
    render(<MarkdownLite content={"Call `solveCircuit()` then check $V = IR$."} />);
    expect(screen.getByText("solveCircuit()")).toBeTruthy();
    expect(document.querySelector(".katex")).toBeTruthy();
  });

  it("preserves headings and lists", () => {
    const { container } = render(
      <MarkdownLite
        content={"## Ohm's law\n\n- Keep units\n- Then $V = IR$"}
      />,
    );
    expect(container.querySelector("h3")).toBeTruthy();
    expect(container.querySelector("ul")).toBeTruthy();
    expect(container.querySelector(".katex")).toBeTruthy();
  });

  it("renders display mathematics", () => {
    const { container } = render(
      <MarkdownLite content={"$$I = \\frac{V}{R}$$"} />,
    );
    expect(container.querySelector(".katex-display, .md-math-display .katex")).toBeTruthy();
    expect(visibleText(container)).not.toContain("$$");
  });
});

describe("Quiz surfaces use the shared math renderer", () => {
  const question: QuizQuestion = {
    id: 1,
    experiment_id: "ohms-law",
    question: "From $I = \\frac{V}{R}$, what is I when V = 5 V?",
    options: [
      { key: "A", text: "5 mA" },
      { key: "B", text: "$V = IR$" },
      { key: "C", text: "1 kΩ" },
      { key: "D", text: "P = VI" },
    ],
  };

  it("renders math inside a quiz question and options", () => {
    const { container } = render(
      <QuestionCard
        question={question}
        number={1}
        total={1}
        selectedAnswer={null}
        onSelect={() => undefined}
      />,
    );
    expect(container.querySelector(".katex")).toBeTruthy();
    expect(visibleText(container)).not.toContain("\\frac");
    expect(visibleText(container)).toContain("5 mA");
    expect(visibleText(container)).toContain("P = VI");
  });

  it("renders math in quiz explanations", () => {
    const feedback: QuestionFeedback[] = [
      {
        question_id: 1,
        question_number: 1,
        question: "Apply $V = I \\times R$",
        options: question.options,
        your_answer: "A",
        correct_answer: "A",
        is_correct: true,
        explanation: "Because $I = \\frac{V}{R}$ and R = V/I.",
      },
    ];
    const { container } = render(<QuizReview feedback={feedback} />);
    expect(container.querySelector(".katex")).toBeTruthy();
    expect(visibleText(container)).not.toContain("\\frac");
    expect(visibleText(container)).toContain("R = V/I");
  });

  it("MathText leaves plain English unchanged", () => {
    const { container } = render(<MathText text="Choose the correct statement." />);
    expect(visibleText(container)).toBe("Choose the correct statement.");
    expect(container.querySelector(".katex")).toBeNull();
  });
});
