import { describe, expect, it } from "vitest";
import {
  buildMentorExpandHref,
  loadSimMentorSnapshot,
  saveSimMentorSnapshot,
  simMentorConversationStorageKey,
} from "../services/mentor/simMentorBridge";

describe("simMentorBridge", () => {
  it("keeps Lab expand on the same conversation id", () => {
    const href = buildMentorExpandHref({
      experimentId: "ohms-law",
      simulationRunId: "run-1",
      simStatus: "completed",
      conversationId: "conv-lab-1",
    });
    expect(href).toContain("/mentor?");
    expect(href).toContain("conversation=conv-lab-1");
    expect(href).toContain("experiment=ohms-law");
    expect(href).toContain("simulation=run-1");
    expect(href).toContain("stage=simulation");
  });

  it("round-trips the live circuit snapshot for the expanded Mentor", () => {
    saveSimMentorSnapshot("ohms-law", {
      components: [{ id: "R1", type: "resistor" }],
      connections: [{ from: "V1.positive", to: "R1.A" }],
    });
    expect(loadSimMentorSnapshot("ohms-law")).toEqual({
      components: [{ id: "R1", type: "resistor" }],
      connections: [{ from: "V1.positive", to: "R1.A" }],
    });
  });

  it("uses a stable sessionStorage conversation key", () => {
    expect(simMentorConversationStorageKey("ohms-law")).toBe(
      "engineeros.sim-mentor.conversation:ohms-law",
    );
  });
});
