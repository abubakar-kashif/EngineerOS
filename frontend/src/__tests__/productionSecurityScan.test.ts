/**
 * Phase 6 — production / security hygiene scan.
 * Distinguishes test-only mocks from production source.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FRONTEND_SRC = join(here, "..");
const BACKEND_APP = join(here, "../../../backend/app");

const SKIP_DIR = new Set(["node_modules", "__tests__", "test", "dist", ".git"]);

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
      const st = statSync(full);
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

describe("Production scan (frontend src, excluding tests)", () => {
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
    }
  });

  it("does not embed OpenAI / SMTP secrets in frontend", () => {
    for (const file of files) {
      const text = read(file);
      expect(text).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
      expect(text).not.toMatch(/OPENAI_API_KEY\s*=\s*["'][^"']+["']/);
      expect(text).not.toMatch(/SMTP_PASSWORD\s*=\s*["'][^"']+["']/);
      expect(text).not.toMatch(/AI_API_KEY\s*=\s*["'][^"']+["']/);
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

describe("Security scan (backend app)", () => {
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
    expect(sim).toMatch(/user_id/);
    expect(sim).toMatch(/def get_simulation\(db:\s*Session,\s*simulation_id:\s*str,\s*user_id:\s*str/);
  });

  it("loads OpenAI key only from environment / constructor (server-side)", () => {
    const provider = read(join(BACKEND_APP, "services/ai/providers/openai_provider.py"));
    expect(provider).toMatch(/OPENAI_API_KEY|AI_API_KEY/);
    expect(provider).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
  });
});
