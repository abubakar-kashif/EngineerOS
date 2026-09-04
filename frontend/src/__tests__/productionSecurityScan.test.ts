/**
 * Phase 9 — production / security hygiene scan.
 * Distinguishes test-only mocks from production source.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FRONTEND_SRC = join(here, "..");
const BACKEND_APP = join(here, "../../../backend/app");
const REPO_ROOT = join(here, "../../..");

const SKIP_DIR = new Set([
  "node_modules",
  "__tests__",
  "test",
  "tests",
  "dist",
  ".git",
  "__pycache__",
  ".venv",
  "venv",
]);

function walkFiles(root: string, exts: string[]): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (SKIP_DIR.has(name)) continue;
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(full);
      else if (exts.some((e) => name.endsWith(e))) out.push(full);
    }
  }
  walk(root);
  return out;
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Phase 9 production scan (frontend src, excluding tests)", () => {
  const files = walkFiles(FRONTEND_SRC, [".ts", ".tsx"]);

  it("scans production frontend modules", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("does not ship fake Mentor streaming / simulated reply builders", () => {
    for (const file of files) {
      const text = read(file);
      expect(text).not.toMatch(/buildSimulatedReply/);
      expect(text).not.toMatch(/fake token streaming/i);
      expect(text).not.toMatch(/TEST_USER_ID/);
      expect(text).not.toMatch(/\btest-user\b/);
      // No timer-driven token drip as a Mentor transport
      if (file.endsWith("mentorService.ts")) {
        expect(text).not.toMatch(/setInterval\s*\(/);
        expect(text).not.toMatch(/setTimeout\s*\(\s*.*chunk/i);
      }
    }
  });

  it("does not embed OpenAI / SMTP secrets in frontend", () => {
    for (const file of files) {
      const text = read(file);
      expect(text).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
      expect(text).not.toMatch(/OPENAI_API_KEY\s*=\s*["'][^"']+["']/);
      expect(text).not.toMatch(/SMTP_PASSWORD\s*=\s*["'][^"']+["']/);
      expect(text).not.toMatch(/AI_API_KEY\s*=\s*["'][^"']+["']/);
      expect(text).not.toMatch(/VITE_.*API_KEY/);
    }
  });

  it("avoids production mock/dummy/simulated Mentor or auth shims", () => {
    const banned = [
      /\bfakeUser\b/i,
      /\bdummyToken\b/i,
      /\bmockMentor\b/i,
      /\bsimulatedReply\b/i,
      /\bfakeResult\b/,
    ];
    for (const file of files) {
      const text = read(file);
      for (const pattern of banned) {
        expect(text, file).not.toMatch(pattern);
      }
    }
  });

  it("calculator still avoids eval / Function constructor", () => {
    const tools = read(join(FRONTEND_SRC, "services/tools/toolsService.ts"));
    expect(tools).not.toMatch(/\beval\s*\(/);
    expect(tools).not.toMatch(/new\s+Function\s*\(/);
  });

  it("only reads is_simulated as legacy metadata (never invents simulated streams)", () => {
    const mentor = read(join(FRONTEND_SRC, "services/mentor/mentorService.ts"));
    expect(mentor).toMatch(/is_simulated:\s*false/);
    expect(mentor).toMatch(/never simulated|provider-backed SSE/i);
  });
});

describe("Phase 9 security scan (backend app)", () => {
  it("rejects client-created assistant messages", () => {
    const routes = read(join(BACKEND_APP, "api/routes/conversations.py"));
    expect(routes).toMatch(/Clients may only post user messages/);
    expect(routes).toMatch(/payload\.role != ["']user["']/);
  });

  it("scopes conversations and mentor to current_user", () => {
    const mentor = read(join(BACKEND_APP, "api/routes/mentor.py"));
    const conversations = read(join(BACKEND_APP, "api/routes/conversations.py"));
    expect(mentor).toMatch(/get_current_user/);
    expect(mentor).toMatch(/current_user\.id/);
    expect(conversations).toMatch(/get_current_user/);
    expect(conversations).toMatch(/user\.id/);
  });

  it("scopes simulations to user_id", () => {
    const sim = read(join(BACKEND_APP, "services/simulation_service.py"));
    const routes = read(join(BACKEND_APP, "api/routes/simulations.py"));
    expect(sim).toMatch(/def get_simulation\(db:\s*Session,\s*simulation_id:\s*str,\s*user_id:\s*str/);
    expect(routes).toMatch(/current_user\.id/);
  });

  it("scopes reports and quiz attempts to the signed-in user", () => {
    const reports = read(join(BACKEND_APP, "api/routes/reports.py"));
    const reportService = read(join(BACKEND_APP, "services/report_service.py"));
    const quiz = read(join(BACKEND_APP, "api/routes/quiz.py"));
    expect(reports).toMatch(/get_current_user|get_optional_user/);
    expect(reportService).toMatch(/Report\.user_id == user\.id/);
    expect(quiz).toMatch(/list_quiz_attempts\(db, user\)/);
    expect(quiz).toMatch(/get_current_user/);
  });

  it("simulation / report AI context require ownership", () => {
    const simCtx = read(join(BACKEND_APP, "services/ai/context/simulation_context.py"));
    const reportCtx = read(join(BACKEND_APP, "services/ai/context/report_context.py"));
    expect(simCtx).toMatch(/Ownership|user_id is required/i);
    expect(simCtx).toMatch(/SimulationRun\.user_id == user_id/);
    expect(reportCtx).toMatch(/ownership/i);
    expect(reportCtx).toMatch(/if not user_id/);
  });

  it("loads OpenAI key only from environment / constructor (server-side)", () => {
    const provider = read(join(BACKEND_APP, "services/ai/providers/openai_provider.py"));
    expect(provider).toMatch(/OPENAI_API_KEY|AI_API_KEY/);
    expect(provider).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
  });

  it("production email never returns verification codes to the client", () => {
    const auth = read(join(BACKEND_APP, "api/routes/auth.py"));
    expect(auth).toMatch(/def _dev_code/);
    expect(auth).toMatch(/if not settings\.DEBUG/);
    expect(auth).toMatch(/EMAIL_DELIVERY/);
    expect(auth).toMatch(/Production \(DEBUG=false\) and SMTP delivery never return codes/);
  });

  it("demo seed account is DEBUG-only", () => {
    const seed = read(join(BACKEND_APP, "db/seed.py"));
    expect(seed).toMatch(/if not settings\.DEBUG/);
    expect(seed).toMatch(/DEMO_PASSWORD/);
  });

  it("committed env examples do not contain live API keys", () => {
    const examples = [
      join(REPO_ROOT, ".env.example"),
      join(REPO_ROOT, "backend/.env.example"),
      join(REPO_ROOT, "frontend/.env.example"),
    ];
    for (const path of examples) {
      let text = "";
      try {
        text = read(path);
      } catch {
        continue;
      }
      expect(text).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
      // Uncommented live assignment (comments like "# AI_API_KEY=" are OK)
      expect(text).not.toMatch(/^\s*AI_API_KEY\s*=\s*\S+/m);
    }
  });
});
