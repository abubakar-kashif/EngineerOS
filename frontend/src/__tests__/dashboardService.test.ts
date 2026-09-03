import { describe, expect, it, vi } from "vitest";
import { getDashboardData } from "../services/dashboard/dashboardService";
import { setAuthToken } from "../services/api";
import { jsonResponse, mockApiRoutes } from "../test/apiMocks";
import type { Experiment, ExperimentDifficulty } from "../types/experiment";

const experiment = (
  id: string,
  title: string,
  prerequisites: string[] = [],
  difficulty: ExperimentDifficulty = "Beginner",
): Experiment => ({
  id,
  title,
  slug: id,
  short_description: null,
  description: null,
  objective: null,
  theory: null,
  difficulty,
  category: "Circuits",
  duration_minutes: 20,
  status: "published",
  prerequisites,
});

const experimentsFixture: Experiment[] = [
  experiment("ohms-law", "Ohm's Law"),
  experiment("series-circuit", "Series Circuit", ["ohms-law"]),
  experiment("parallel-circuit", "Parallel Circuit", ["ohms-law"]),
  experiment("kvl", "Kirchhoff's Voltage Law", ["ohms-law"], "Intermediate"),
];

const preferencesFixture = {
  theme: "dark",
  preferred_difficulty: "Intermediate",
  learning_reminders: false,
  default_experiment_view: "overview",
  notify_quiz_results: true,
  notify_report_completion: true,
  notify_learning_reminders: false,
  notify_email: true,
  notify_activity: true,
};

const progressSummaryFixture = {
  completed_experiments: 1,
  completed_quizzes: 1,
  average_quiz_score: 90,
  overall_progress: 25,
};

const draftReportFixture = [
  {
    id: 7,
    experiment_id: "ohms-law",
    title: "Ohm's Law Report",
    observations: "Measured V and I.",
    conclusion: "Linear as expected.",
    status: "draft",
  },
];

const attemptsFixture = [
  {
    id: 1,
    experiment_id: "ohms-law",
    score: 90,
    total_questions: 10,
    correct_answers: 9,
    passed: true,
    created_at: "2026-09-01T12:00:00Z",
  },
];

describe("getDashboardData (signed in)", () => {
  it("reports the account's server-side progress without leaking device-local tracking", async () => {
    setAuthToken("token-123");
    // Local (device) tracking knows about parallel-circuit — it must NOT
    // leak into the signed-in view.
    localStorage.setItem(
      "engineeros_experiment_progress",
      JSON.stringify({ "parallel-circuit": "in_progress" }),
    );
    localStorage.setItem(
      "engineeros_recent_experiments",
      JSON.stringify(["series-circuit"]),
    );

    const calls = mockApiRoutes({
      "GET /experiments": jsonResponse({ items: experimentsFixture, total: 4 }),
      "GET /progress/me": jsonResponse([
        {
          id: 1,
          experiment_id: "ohms-law",
          status: "completed",
          updated_at: "2026-08-30T10:00:00Z",
        },
        {
          id: 2,
          experiment_id: "series-circuit",
          status: "in_progress",
          updated_at: "2026-09-01T09:00:00Z",
        },
      ]),
      "GET /quizzes/me/attempts": jsonResponse(attemptsFixture),
      "GET /users/me/preferences": jsonResponse(preferencesFixture),
      "GET /progress": jsonResponse(progressSummaryFixture),
      "GET /reports": jsonResponse(draftReportFixture),
    });

    const data = await getDashboardData();

    // Server rows are the account's truth: 1 completed, 1 in progress —
    // the device-local parallel-circuit entry is ignored.
    expect(data.kpis).toMatchObject({
      completed_experiments: 1,
      in_progress_experiments: 1,
      average_quiz_score: 90,
      overall_progress: 25,
    });

    const experimentsTrack = data.progress.find((t) => t.key === "experiments");
    expect(experimentsTrack).toMatchObject({ completed: 1, total: 4, percent: 25 });

    const quizzesTrack = data.progress.find((t) => t.key === "quizzes");
    expect(quizzesTrack).toMatchObject({ completed: 1, total: 4 });

    const reportsTrack = data.progress.find((t) => t.key === "reports");
    expect(reportsTrack).toMatchObject({ completed: 0, total: 1 });

    // The persisted attempt history powers the quiz data...
    expect(data.quizAttempts).toHaveLength(1);
    expect(data.quizAttempts[0]).toMatchObject({
      experiment_id: "ohms-law",
      experiment_title: "Ohm's Law",
      score: 90,
      status: "excellent",
    });
    // ...and surfaces in activity together with experiment progress rows.
    expect(data.activity[0]).toMatchObject({
      type: "quiz",
      title: "Ohm's Law quiz",
    });
    expect(data.activity.some((item) => item.type === "experiment")).toBe(true);
    expect(data.continueLearning?.id).toBe("series-circuit");
    // kvl (prerequisite done, matches preferred difficulty) ranks first;
    // parallel-circuit is genuinely not started for this account now.
    expect(data.nextRecommended).toHaveLength(2);
    expect(data.nextRecommended[0].experiment.id).toBe("kvl");
    expect(data.nextRecommended[0].reason).toBe(
      "Natural next step after Ohm's Law",
    );
    expect(data.nextRecommended[1].experiment.id).toBe("parallel-circuit");

    // Account-scoped endpoints are authenticated with the session token.
    const myProgressCall = calls.find((call) => call.path === "/progress/me");
    expect(myProgressCall?.headers.Authorization).toBe("Bearer token-123");
    expect(calls.map((call) => call.path).sort()).toEqual(
      [
        "/experiments",
        "/progress",
        "/progress/me",
        "/quizzes/me/attempts",
        "/reports",
        "/users/me/preferences",
      ].sort(),
    );
  });
});

describe("getDashboardData (anonymous)", () => {
  it("skips account-scoped endpoints and reports only local progress", async () => {
    localStorage.setItem(
      "engineeros_experiment_progress",
      JSON.stringify({ "ohms-law": "completed" }),
    );

    const calls = mockApiRoutes({
      "GET /experiments": jsonResponse({ items: experimentsFixture, total: 4 }),
      "GET /reports": jsonResponse(draftReportFixture),
    });

    const data = await getDashboardData();

    const paths = calls.map((call) => call.path);
    expect(paths).not.toContain("/progress");
    expect(paths).not.toContain("/progress/me");
    expect(paths).not.toContain("/quizzes/me/attempts");
    expect(paths).not.toContain("/users/me/preferences");
    // No token → no Authorization header on any request.
    expect(calls.every((call) => call.headers.Authorization === undefined)).toBe(true);

    expect(data.kpis).toMatchObject({
      completed_experiments: 1,
      in_progress_experiments: 0,
      average_quiz_score: null,
    });
    expect(data.continueLearning).toBeNull();
  });
});

describe("getDashboardData (backend unreachable)", () => {
  it("rejects so the dashboard can show an honest error state", async () => {
    setAuthToken("token-123");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );

    // No fabricated fallback data — the page renders its error state instead.
    await expect(getDashboardData()).rejects.toThrow();
  });
});
