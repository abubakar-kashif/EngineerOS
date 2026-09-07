import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import QuizSetup from "../components/quiz/QuizSetup";
import type { QuizQuestionCount } from "../types/quiz";

describe("QuizSetup", () => {
  it("shows difficulty meaning, quantity, topic summary, and Start Quiz", async () => {
    const user = userEvent.setup();
    const onDifficultyChange = vi.fn();
    const onQuestionCountChange = vi.fn();
    const onStart = vi.fn();

    render(
      <MemoryRouter>
        <QuizSetup
          topic="Ohm's Law"
          difficulty="medium"
          questionCount={20}
          poolSize={55}
          preferredCount={22}
          supportedCounts={[10, 20, 40]}
          onDifficultyChange={onDifficultyChange}
          onQuestionCountChange={onQuestionCountChange}
          onStart={onStart}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /what difficulty/i })).toBeInTheDocument();
    expect(screen.getByText(/fundamental concepts and straightforward calculations/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /medium/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /20 questions/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /40 questions/i })).not.toBeDisabled();
    expect(screen.getByText("Difficulty")).toBeInTheDocument();
    expect(screen.getByText("Ohm's Law")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /easy/i }));
    expect(onDifficultyChange).toHaveBeenCalledWith("easy");

    await user.click(screen.getByRole("radio", { name: /10 questions/i }));
    expect(onQuestionCountChange).toHaveBeenCalledWith(10 as QuizQuestionCount);

    await user.click(screen.getByRole("button", { name: /start quiz/i }));
    expect(onStart).toHaveBeenCalled();
  });
});
