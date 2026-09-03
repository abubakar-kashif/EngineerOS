import type { DashboardProgressTrack } from "../../types/dashboard";

/** Fill color per track, reused from the shared ui-progress palette. */
const TRACK_FILL: Record<DashboardProgressTrack["key"], string> = {
  experiments: "ui-progress-fill-primary",
  quizzes: "ui-progress-fill-success",
  reports: "ui-progress-fill-warning",
};

type ProgressOverviewProps = {
  progress: DashboardProgressTrack[];
};

/**
 * "How am I doing?" — progress split across Experiments, Quizzes
 * and Reports with completion counts and bars.
 */
function ProgressOverview({ progress }: ProgressOverviewProps) {
  return (
    <section className="dashboard-panel" aria-label="Learning progress">
      <div className="dashboard-panel-head">
        <h2 className="dashboard-panel-title">Learning progress</h2>
        <span className="dashboard-panel-hint">
          {progress.reduce((sum, track) => sum + track.completed, 0)} items completed
        </span>
      </div>

      <div className="dashboard-progress-list">
        {progress.map((track) => (
          <div key={track.key} className="dashboard-progress-item">
            <div className="ui-progress ui-progress-md">
              <div className="ui-progress-header">
                <span className="ui-progress-label">{track.label}</span>
                <span className="ui-progress-value">
                  {track.completed}/{track.total} · {track.percent}%
                </span>
              </div>
              <div
                className="ui-progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={track.percent}
                aria-label={`${track.label} progress`}
              >
                <div
                  className={`ui-progress-fill ${TRACK_FILL[track.key]}`}
                  style={{ width: `${track.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProgressOverview;
