import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Circle,
  Clock,
  BookOpen,
  Target,
  Award,
  History,
  Ruler,
  Eye,
  AlertTriangle,
  ShieldAlert,
  Globe,
  FlaskConical,
  Zap,
} from "lucide-react";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import LoadingState from "../components/common/LoadingState";

import ExperimentFormulaSection from "../components/experiments/ExperimentFormula";
import ExperimentComponentsList from "../components/experiments/ExperimentComponents";
import ExperimentInstructionsSection from "../components/experiments/ExperimentInstructions";
import ExperimentCard from "../components/experiments/ExperimentCard";
import DiagramRenderer from "../components/experiments/diagrams";
import QuizCTA from "../components/experiments/QuizCTA";
import ReportCTA from "../components/experiments/ReportCTA";
import MentorCTA from "../components/experiments/MentorCTA";

import { getExperimentById } from "../services/experimentService";
import { getStatusMap, saveStatus } from "../services/progressService";
import { getAuthToken } from "../services/api";
import { mockExperiments } from "../data/mockExperiments";
import type { Experiment } from "../types/experiment";
import {
  addRecentExperiment,
  getAllProgress,
  getRecentExperiments,
  type UserProgress,
} from "../utils/experimentProgress";

const difficultyVariant: Record<string, "success" | "warning" | "danger"> = {
  Beginner: "success",
  Intermediate: "warning",
  Advanced: "danger",
};

function ProgressBadge({ status }: { status: UserProgress }) {
  if (status === "completed") {
    return (
      <Badge variant="success" className="detail-progress-badge">
        <CheckCircle2 size={13} /> Completed
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge variant="info" className="detail-progress-badge">
        <CircleDot size={13} /> In Progress
      </Badge>
    );
  }
  return (
    <Badge variant="default" className="detail-progress-badge">
      <Circle size={13} /> Not Started
    </Badge>
  );
}

function ExperimentDetailsPage() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const navigate = useNavigate();

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressOverride, setProgressOverride] = useState<UserProgress | null>(null);

  // Account-scoped statuses: the signed-in user's server rows (null while
  // they load), or this device's local tracking for anonymous visitors.
  const [statusMap, setStatusMap] = useState<Record<string, UserProgress> | null>(() =>
    getAuthToken() ? null : getAllProgress(),
  );

  /* Derive recent experiments during render — avoids setState inside useEffect */
  const recentExperiments = useMemo(() => {
    if (!experiment) return [];
    const recentIds = getRecentExperiments().filter((id) => id !== experiment.id);
    return recentIds
      .map((id) => mockExperiments.find((m) => m.id === id))
      .filter(Boolean)
      .slice(0, 3) as Experiment[];
  }, [experiment]);

  /* Resolve experiment ids (prerequisites, related) via the offline catalog —
     the list endpoint returns lean rows only. */
  const experimentById = useMemo(() => {
    const map = new Map<string, Experiment>();
    mockExperiments.forEach((m) => map.set(m.id, m));
    if (experiment) map.set(experiment.id, experiment);
    return map;
  }, [experiment]);

  /* Related experiments, resolved through the offline catalog */
  const related = (experiment?.related_experiments ?? [])
    .map((id) => experimentById.get(id))
    .filter((rel): rel is Experiment => rel !== undefined);

  /* Derive progress during render — avoids setState inside useEffect */
  const progress: UserProgress = (() => {
    if (progressOverride) return progressOverride;
    if (!experiment || statusMap === null) return "not_started";
    // Viewing an experiment implies it is at least in progress.
    return statusMap[experiment.id] ?? "in_progress";
  })();

  /* Load the account's statuses when signed in */
  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    getStatusMap()
      .then((map) => {
        if (!cancelled) setStatusMap(map);
      })
      .catch(() => {
        if (!cancelled) setStatusMap({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Load experiment data */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!experimentId) {
        setLoading(false);
        setError("Experiment ID is missing.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getExperimentById(experimentId);

        if (cancelled) return;

        if (data) {
          setExperiment(data);
        } else {
          const mock = mockExperiments.find(
            (m) => m.id === experimentId || m.slug === experimentId,
          );
          setExperiment(mock ?? null);
        }
      } catch {
        if (cancelled) return;
        const mock = mockExperiments.find(
          (m) => m.id === experimentId || m.slug === experimentId,
        );
        if (mock) {
          setExperiment(mock);
          setError(null);
        } else {
          setExperiment(null);
          setError("Unable to load this experiment. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [experimentId]);

  /* Side effects: track recent visit + auto-mark in_progress */
  useEffect(() => {
    if (!experiment) return;
    addRecentExperiment(experiment.id);

    // Wait for the account's statuses before auto-marking — marking blind
    // could downgrade a completed experiment back to in progress.
    if (statusMap === null || statusMap[experiment.id]) return;

    // Viewing an experiment marks it as started (best-effort; the next
    // load shows the truth).
    saveStatus(experiment.id, "in_progress").catch(() => {});
  }, [experiment, statusMap]);

  function cycleProgress() {
    if (!experiment) return;
    // The server has no "not started" state (a missing row), so signed-in
    // progress toggles between in progress and completed.
    const next: UserProgress = getAuthToken()
      ? progress === "completed"
        ? "in_progress"
        : "completed"
      : progress === "not_started"
        ? "in_progress"
        : progress === "in_progress"
          ? "completed"
          : "not_started";
    saveStatus(experiment.id, next).catch(() => {
      // Status changes are best-effort; the next load shows the truth.
    });
    setStatusMap((prev) => ({ ...(prev ?? {}), [experiment.id]: next }));
    setProgressOverride(next);
  }

  /* ---------- States ---------- */

  if (loading) {
    return (
      <main className="page">
        <LoadingState message="Loading experiment..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <Card className="detail-error-card">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </main>
    );
  }

  if (!experiment) {
    return (
      <main className="page">
        <Card className="detail-empty-card">
          <p className="eyebrow">EXPERIMENT</p>
          <h1>Experiment Not Found</h1>
          <p>We could not find the experiment you are looking for.</p>
          <Button variant="primary" onClick={() => navigate("/experiments")}>
            Back to Experiments
          </Button>
        </Card>
      </main>
    );
  }

  const description =
    experiment.description ||
    experiment.short_description ||
    "Explore this electrical engineering experiment.";

  // Recommend next experiment (next by difficulty or first not-yet-completed)
  const recommended = mockExperiments.find(
    (m) => m.id !== experiment.id && statusMap?.[m.id] !== "completed",
  );

  // Experiment number (position in the catalog)
  const experimentNumber =
    mockExperiments.findIndex((m) => m.id === experiment.id) + 1 || undefined;

  return (
    <main className="page">
      {/* ── BREADCRUMB ── */}
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span className="detail-bc-sep">/</span>
        <Link to="/experiments">Experiments</Link>
        <span className="detail-bc-sep">/</span>
        <span className="detail-bc-current">{experiment.title}</span>
      </nav>

      {/* ── BACK LINK ── */}
      <button className="detail-back" onClick={() => navigate("/experiments")}>
        <ArrowLeft size={14} /> Back to Experiments
      </button>

      {/* ── HEADER ── */}
      <section className="detail-header">
        <div className="detail-header-inner">
          <p className="eyebrow">
            {experimentNumber ? `EXPERIMENT #${experimentNumber}` : "EXPERIMENT"}
          </p>
          <h1 className="detail-title">{experiment.title}</h1>
          <p className="detail-description">{description}</p>

          <div className="detail-badges">
            <Badge variant={difficultyVariant[experiment.difficulty] || "default"} size="sm">
              {experiment.difficulty}
            </Badge>
            <Badge variant="default" size="sm">
              {experiment.category}
            </Badge>
            <Badge variant="default" size="sm">
              <Clock size={12} /> {experiment.duration_minutes} min
            </Badge>
            <ProgressBadge status={progress} />
          </div>
        </div>
      </section>

      {/* ── PROGRESS CONTROL ── */}
      <div className="detail-progress-control">
        <button className="detail-progress-toggle" onClick={cycleProgress}>
          {progress === "completed" ? (
            <>
              <CheckCircle2 size={16} />{" "}
              {getAuthToken() ? "Mark as In Progress" : "Mark as Not Started"}
            </>
          ) : progress === "in_progress" ? (
            <>
              <Award size={16} /> Mark as Completed
            </>
          ) : (
            <>
              <Target size={16} /> Start Learning
            </>
          )}
        </button>
      </div>

      {/* ── CONTENT GRID ── */}
      <div className="detail-content">
        {/* ── LEFT COLUMN ── */}
        <div className="detail-main">
          {/* 1. OBJECTIVE */}
          {experiment.objective && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">OBJECTIVE</p>
                <h2 className="detail-section-title">
                  <BookOpen size={18} /> Learning Objective
                </h2>
                <p className="detail-section-text">{experiment.objective}</p>
              </div>
            </Card>
          )}

          {/* 2. LEARNING OUTCOMES */}
          {experiment.learning_outcomes && experiment.learning_outcomes.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">LEARNING OUTCOMES</p>
                <h2 className="detail-section-title">What You Will Be Able to Do</h2>
                <ul className="detail-outcomes-list">
                  {experiment.learning_outcomes.map((outcome, i) => (
                    <li key={i} className="detail-outcome">
                      <CheckCircle2 size={14} className="detail-outcome-icon" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* 3. PREREQUISITES */}
          {experiment.prerequisites && experiment.prerequisites.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">PREREQUISITES</p>
                <h2 className="detail-section-title">Before You Start</h2>
                <ul className="detail-prereqs-list">
                  {experiment.prerequisites.map((p) => {
                    const target = experimentById.get(p);
                    return (
                      <li key={p}>
                        {target ? <Link to={`/experiments/${target.id}`}>{target.title}</Link> : p}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          )}

          {/* 4. HISTORICAL BACKGROUND */}
          {experiment.historical_background && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">HISTORY</p>
                <h2 className="detail-section-title">
                  <History size={18} /> Where It Came From
                </h2>
                <p className="detail-section-text">{experiment.historical_background}</p>
              </div>
            </Card>
          )}

          {/* 5. THEORY */}
          {experiment.theory && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">THEORY</p>
                <h2 className="detail-section-title">Background Theory</h2>
                <p className="detail-section-text">{experiment.theory}</p>
              </div>
            </Card>
          )}

          {/* 6. KEY EQUATIONS */}
          {experiment.formulas && experiment.formulas.length > 0 && (
            <ExperimentFormulaSection formulas={experiment.formulas} />
          )}

          {/* 7. VARIABLES + UNITS */}
          {experiment.variables && experiment.variables.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">VARIABLES</p>
                <h2 className="detail-section-title">
                  <Ruler size={18} /> Symbols &amp; Units
                </h2>
                <div className="detail-vars-wrap">
                  <table className="detail-vars-table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {experiment.variables.map((v) => (
                        <tr key={v.symbol}>
                          <td className="detail-var-symbol">{v.symbol}</td>
                          <td className="detail-var-name">{v.name}</td>
                          <td>{v.unit ?? "—"}</td>
                          <td>{v.description ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* 8. CIRCUIT DIAGRAM (SVG) */}
          <Card className="detail-section-card">
            <div className="detail-section">
              <p className="eyebrow">CIRCUIT DIAGRAM</p>
              <h2 className="detail-section-title">
                <Zap size={18} /> Schematic
              </h2>
              <div className="detail-diagram-wrap">
                <DiagramRenderer experimentId={experiment.id} />
                {experiment.circuit_diagram?.caption && (
                  <p className="detail-diagram-caption">{experiment.circuit_diagram.caption}</p>
                )}
              </div>
            </div>
          </Card>

          {/* 9. COMPONENTS REQUIRED */}
          {experiment.components && experiment.components.length > 0 && (
            <ExperimentComponentsList components={experiment.components} />
          )}

          {/* 10. PROCEDURE */}
          {experiment.procedure && experiment.procedure.length > 0 && (
            <ExperimentInstructionsSection procedure={experiment.procedure} />
          )}

          {/* 11. OBSERVATION GUIDE */}
          {experiment.observation_guidance && experiment.observation_guidance.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">OBSERVATIONS</p>
                <h2 className="detail-section-title">
                  <Eye size={18} /> What to Watch For
                </h2>
                <ul className="detail-observe-list">
                  {experiment.observation_guidance.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* 12. EXPECTED RESULTS */}
          {experiment.expected_results && experiment.expected_results.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">EXPECTED RESULTS</p>
                <h2 className="detail-section-title">What You Should Observe</h2>
                <ul className="detail-expected-list">
                  {experiment.expected_results.map((result, i) => (
                    <li key={i}>{result}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* 13. COMMON MISTAKES */}
          {experiment.common_mistakes && experiment.common_mistakes.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">COMMON MISTAKES</p>
                <h2 className="detail-section-title">
                  <AlertTriangle size={18} /> What Can Go Wrong
                </h2>
                <ul className="detail-mistakes-list">
                  {experiment.common_mistakes.map((m, i) => (
                    <li key={i} className="detail-mistake">
                      <p className="detail-mistake-title">{m.mistake}</p>
                      <p className="detail-mistake-consequence">{m.consequence}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* 14. SAFETY / PRECAUTIONS */}
          {experiment.safety_precautions && experiment.safety_precautions.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">SAFETY</p>
                <h2 className="detail-section-title">
                  <ShieldAlert size={18} /> Safety Precautions
                </h2>
                <ul className="detail-safety-list">
                  {experiment.safety_precautions.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* 15. ENGINEERING APPLICATIONS */}
          {experiment.real_world_applications && experiment.real_world_applications.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">APPLICATIONS</p>
                <h2 className="detail-section-title">
                  <Globe size={18} /> Where It Is Used
                </h2>
                <ul className="detail-apps-list">
                  {experiment.real_world_applications.map((app, i) => (
                    <li key={i}>{app}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* 16–19. CTA GRID */}
          <section className="detail-cta-grid">
            <Card className="detail-section-card detail-cta-card detail-cta-sim">
              <div className="detail-cta">
                <Target size={24} className="detail-cta-icon" />
                <p className="eyebrow">READY TO START?</p>
                <h2 className="detail-cta-title">Run Simulation</h2>
                <p className="detail-cta-desc">
                  Open the freeform simulation lab to build the circuit and run live measurements.
                </p>
                <Button to={`/simulation?experiment=${encodeURIComponent(experiment.id)}`} variant="primary" size="lg">
                  Start Experiment <ArrowRight size={16} />
                </Button>
              </div>
            </Card>
            <QuizCTA experimentId={experiment.id} />
            <ReportCTA experimentId={experiment.id} experimentTitle={experiment.title} />
            <MentorCTA experimentId={experiment.id} />
          </section>

          {/* 20. RELATED EXPERIMENTS */}
          {related.length > 0 && (
            <Card className="detail-section-card">
              <div className="detail-section">
                <p className="eyebrow">RELATED EXPERIMENTS</p>
                <h2 className="detail-section-title">
                  <FlaskConical size={18} /> Explore Related
                </h2>
                <ul className="detail-related-list">
                  {related.map((rel) => (
                    <li key={rel.id}>
                      <Link to={`/experiments/${rel.id}`}>
                        <FlaskConical size={13} />
                        <span>{rel.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="detail-sidebar">
          {/* EXPERIMENT QUICK INFO */}
          <Card className="detail-section-card detail-quick-info">
            <div className="detail-section">
              <p className="eyebrow">QUICK INFO</p>
              <dl className="detail-info-list">
                <div className="detail-info-row">
                  <dt>Category</dt>
                  <dd>{experiment.category}</dd>
                </div>
                <div className="detail-info-row">
                  <dt>Difficulty</dt>
                  <dd>{experiment.difficulty}</dd>
                </div>
                <div className="detail-info-row">
                  <dt>Duration</dt>
                  <dd>{experiment.duration_minutes} min</dd>
                </div>
                {experiment.simulation_configuration && (
                  <div className="detail-info-row">
                    <dt>Simulation</dt>
                    <dd>
                      {experiment.simulation_configuration.mode === "parallel"
                        ? "Parallel"
                        : "Series"}{" "}
                      mode
                    </dd>
                  </div>
                )}
                <div className="detail-info-row">
                  <dt>Status</dt>
                  <dd>{experiment.status}</dd>
                </div>
              </dl>
            </div>
          </Card>
        </aside>
      </div>

      {/* ── BOTTOM CARDS — Up Next + Recently Viewed ── */}
      {(recommended || recentExperiments.length > 0) && (
        <section className="detail-bottom-cards">
          {recommended && (
            <div className="detail-bottom-col">
              <p className="eyebrow">UP NEXT</p>
              <h2 className="detail-bottom-title">Recommended Next Experiment</h2>
              <ExperimentCard
                experiment={recommended}
                progress={statusMap?.[recommended.id]}
              />
            </div>
          )}
          {recentExperiments.length > 0 && (
            <div className="detail-bottom-col">
              <p className="eyebrow">RECENTLY VIEWED</p>
              <h2 className="detail-bottom-title">Continue Where You Left Off</h2>
              <div className="detail-recent-grid">
                {recentExperiments.map((exp) => (
                  <ExperimentCard
                    key={exp.id}
                    experiment={exp}
                    progress={statusMap?.[exp.id]}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default ExperimentDetailsPage;
