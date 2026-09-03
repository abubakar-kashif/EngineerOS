/**
 * Layout-matching skeleton for the dashboard: header, KPI row,
 * progress + activity columns, and the recommendations row.
 */
function DashboardSkeleton() {
  return (
    <div className="page dashboard-page" aria-busy="true" aria-label="Loading dashboard">
      <div className="dashboard-skeleton-header">
        <span className="ui-skeleton ui-skeleton-text" style={{ width: "40%", height: 28 }} />
        <span className="ui-skeleton ui-skeleton-text" style={{ width: "60%" }} />
      </div>

      <div className="dashboard-kpis">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="dashboard-kpi dashboard-kpi-skeleton">
            <span className="ui-skeleton ui-skeleton-text" style={{ width: "45%" }} />
            <span className="ui-skeleton ui-skeleton-text" style={{ width: "30%", height: 30 }} />
            <span className="ui-skeleton ui-skeleton-text" style={{ width: "70%" }} />
          </div>
        ))}
      </div>

      <div className="dashboard-grid-main">
        <div className="dashboard-panel dashboard-panel-skeleton">
          <span className="ui-skeleton ui-skeleton-text" style={{ width: "50%", height: 18 }} />
          {[0, 1, 2].map((index) => (
            <div key={index} className="dashboard-skeleton-track">
              <span className="ui-skeleton ui-skeleton-text" style={{ width: "55%" }} />
              <span className="ui-skeleton ui-skeleton-rectangular" style={{ width: "100%", height: 8, borderRadius: 999 }} />
            </div>
          ))}
        </div>

        <div className="dashboard-panel dashboard-panel-skeleton">
          <span className="ui-skeleton ui-skeleton-text" style={{ width: "45%", height: 18 }} />
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="dashboard-skeleton-activity">
              <span className="ui-skeleton ui-skeleton-circular" style={{ width: 34, height: 34 }} />
              <div className="dashboard-skeleton-activity-lines">
                <span className="ui-skeleton ui-skeleton-text" style={{ width: "70%" }} />
                <span className="ui-skeleton ui-skeleton-text" style={{ width: "45%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-recommend-grid">
        {[0, 1, 2].map((index) => (
          <div key={index} className="dashboard-recommend-card dashboard-panel-skeleton">
            <span className="ui-skeleton ui-skeleton-text" style={{ width: "60%", height: 16 }} />
            <span className="ui-skeleton ui-skeleton-text" style={{ width: "90%" }} />
            <span className="ui-skeleton ui-skeleton-text" style={{ width: "40%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardSkeleton;
