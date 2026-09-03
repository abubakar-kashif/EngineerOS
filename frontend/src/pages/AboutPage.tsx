import type { ReactNode } from "react";
import Card from "../components/ui/Card";
import {
  ArrowRight,
  Cpu,
  FlaskConical,
  Layers,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
type TechGroup = "Frontend" | "Backend" | "Data";
interface BomItem {
  tag: string;
  name: string;
  group: TechGroup;
  role: string;
}
interface PipelineStage {
  stage: string;
  icon: ReactNode;
  title: string;
  description: string;
}
interface Stat {
  value: string;
  label: string;
}
const billOfMaterials: BomItem[] = [
  { tag: "U1", name: "React", group: "Frontend", role: "UI library" },
  { tag: "U2", name: "TypeScript", group: "Frontend", role: "Language" },
  { tag: "U3", name: "Vite", group: "Frontend", role: "Build tool" },
  { tag: "U4", name: "Tailwind CSS", group: "Frontend", role: "Styling" },
  { tag: "U5", name: "FastAPI", group: "Backend", role: "API framework" },
  { tag: "U6", name: "Python", group: "Backend", role: "Language" },
  { tag: "U7", name: "SQLite", group: "Data", role: "Database" },
  { tag: "U8", name: "SQLAlchemy", group: "Data", role: "ORM" },
];
const groupColor: Record<TechGroup, string> = {
  Frontend: "var(--color-primary, #38bdf8)",
  Backend: "var(--color-success, #10b981)",
  Data: "var(--color-warning, #f59e0b)",
};
const pipeline: PipelineStage[] = [
  {
    stage: "01",
    icon: <Lightbulb size={18} />,
    title: "Theory before simulation",
    description:
      "Every experiment starts with the underlying concept before students touch a circuit.",
  },
  {
    stage: "02",
    icon: <FlaskConical size={18} />,
    title: "Learn by doing",
    description:
      "Students build, run, and validate circuits instead of only reading about them.",
  },
  {
    stage: "03",
    icon: <Sparkles size={18} />,
    title: "Feedback that explains why",
    description:
      "Quizzes and results are built to reinforce understanding, not just record a score.",
  },
];
const stats: Stat[] = [
  { value: "08", label: "Technologies" },
  { value: "05", label: "Team members" },
  { value: "01", label: "Shared architecture" },
];
function AboutPage() {
  return (
    <div className="page about-page-v2" style={{ display: "flex", flexDirection: "column" }}>
      <style>{`
        .about-page-v2 .eos-bom-row { transition: background-color 0.15s ease; border-radius: 0.4rem; }
        .about-page-v2 .eos-bom-row:hover { background: var(--color-surface-hover, rgba(56, 189, 248, 0.08)); }
        .about-page-v2 .eos-stage-card { transition: transform 0.2s ease; }
        .about-page-v2 .eos-stage-card:hover { transform: translateY(-3px); }
        .about-page-v2 .eos-node { transition: transform 0.2s ease; }
        .about-page-v2 .eos-node:hover { transform: scale(1.06); }
      `}</style>
      <div
        style={{
          padding: "1rem 1rem",
          maxWidth: "1200px",
          margin: "0 auto",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "3rem",
          flex: 1,
          width: "100%",
        }}
      >
        {/* Hero */}
        <section style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
              borderBottom: "1px solid var(--color-border, #334155)",
              paddingBottom: "0.85rem",
              fontSize: "0.7rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              opacity: 0.6,
            }}
          >
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "760px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-primary, #38bdf8)",
                fontWeight: 600,
              }}
            >
              About EngineerOS
            </span>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 700, margin: 0, lineHeight: 1.15 }}>
              A learning environment built like an engineering project.
            </h1>
            <p style={{ fontSize: "1rem", lineHeight: 1.7, margin: 0, opacity: 0.85 }}>
              EngineerOS connects theory, hands-on experiments, and feedback into one
              continuous learning loop for electrical engineering students.
            </p>
          </div>
          {/* Signal-trace stat bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
            {stats.map((stat, i) => (
              <div key={stat.label} style={{ display: "contents" }}>
                <div
                  className="eos-node"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", minWidth: "88px" }}
                >
                  <div
                    style={{
                      width: "3rem",
                      height: "3rem",
                      borderRadius: "999px",
                      border: "2px solid var(--color-primary, #38bdf8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      color: "var(--color-primary, #38bdf8)",
                    }}
                  >
                    {stat.value}
                  </div>
                  <span style={{ fontSize: "0.75rem", opacity: 0.7, textAlign: "center" }}>{stat.label}</span>
                </div>
                {i < stats.length - 1 && (
                  <div style={{ flex: 1, height: "1px", background: "var(--color-border, #334155)", minWidth: "24px" }} />
                )}
              </div>
            ))}
          </div>
        </section>
        {/* Signal path: problem -> solution */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
            <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-danger, #ef4444)" }}>
                <ShieldAlert size={18} />
                <span style={{ fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                  Input · The problem
                </span>
              </div>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.65, margin: 0, opacity: 0.9 }}>
                Electrical engineering theory is usually taught separately from
                hands-on practice. Students memorize formulas without a fast,
                safe way to test them and see the results.
              </p>
            </div>
            <div
              style={{
                flex: "0 0 auto",
                alignSelf: "center",
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "999px",
                border: "1px solid var(--color-border, #334155)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary, #38bdf8)",
              }}
            >
              <ArrowRight size={18} />
            </div>
            <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary, #38bdf8)" }}>
                <Layers size={18} />
                <span style={{ fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                  Output · The solution
                </span>
              </div>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.65, margin: 0, opacity: 0.9 }}>
                EngineerOS gives students a single place to move from theory to
                experiment to validated results, with guidance along the way
                instead of a static textbook.
              </p>
            </div>
          </div>
        </Card>
        {/* Bill of materials (tech stack) */}
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Cpu size={18} style={{ color: "var(--color-primary, #38bdf8)" }} />
              <div>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.6 }}>
                  Bill of materials
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0.15rem 0 0" }}>What's under the hood</h3>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {billOfMaterials.map((item, i) => (
                <div
                  key={item.tag}
                  className="eos-bom-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.65rem 0.5rem",
                    borderTop: i === 0 ? "none" : "1px solid var(--color-border, #334155)",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", opacity: 0.5, width: "1.75rem", flexShrink: 0 }}>
                    {item.tag}
                  </span>
                  <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "999px", background: groupColor[item.group], flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, minWidth: "130px" }}>{item.name}</span>
                  <span style={{ fontSize: "0.8rem", opacity: 0.6, marginLeft: "auto", textAlign: "right" }}>
                    {item.group} · {item.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        {/* Learning-loop pipeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.6 }}>
              Learning loop
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0.25rem 0 0" }}>A three-stage pipeline</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            {pipeline.map((point) => (
              <div key={point.title} className="eos-stage-card">
                <Card>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div
                        style={{
                          width: "fit-content",
                          padding: "0.4rem",
                          borderRadius: "0.5rem",
                          background: "var(--color-surface-hover, rgba(56, 189, 248, 0.1))",
                          color: "var(--color-primary, #38bdf8)",
                        }}
                      >
                        {point.icon}
                      </div>
                      <span style={{ fontSize: "0.7rem", opacity: 0.4 }}>STAGE {point.stage}</span>
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>{point.title}</h4>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.6, margin: 0, opacity: 0.85 }}>{point.description}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
        {/* Team */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  background: "var(--color-surface-hover, rgba(56, 189, 248, 0.1))",
                  color: "var(--color-primary, #38bdf8)",
                  flexShrink: 0,
                }}
              >
                <Users size={22} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: "520px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>The team</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.65, margin: 0, opacity: 0.9 }}>
                  EngineerOS is built by a five-person student team covering
                  frontend, backend, and integration, working toward a shared
                  architecture rather than five separate projects.
                </p>
              </div>
            </div>
            <span
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                padding: "0.4rem 0.7rem",
                borderRadius: "999px",
                border: "1px solid var(--color-border, #334155)",
                opacity: 0.75,
                whiteSpace: "nowrap",
              }}
            >
              5 contributors · active build
            </span>
          </div>
        </Card>
      </div>
      <footer
        style={{
          borderTop: "1px solid var(--color-border, #334155)",
          paddingTop: "1.25rem",
          paddingBottom: "2.5rem",
          paddingLeft: "4rem",
          paddingRight: "4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.875rem",
          opacity: 0.7,
        }}
      >
        <p style={{ margin: 0 }}>EngineerOS — Electrical Engineering Learning Environment &copy; 2026</p>
      </footer>
    </div>
  );
}
export default AboutPage;