function ReportSkeleton() {
  return (
    <article className="report-card report-card--skeleton" aria-hidden="true">
      <div className="report-card-head">
        <div className="ui-skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
        <div style={{ flex: 1 }}>
          <div className="ui-skeleton ui-skeleton-text" style={{ width: "55%", height: 16 }} />
          <div className="ui-skeleton ui-skeleton-text" style={{ width: "30%", height: 11, marginTop: 6 }} />
        </div>
        <div className="ui-skeleton" style={{ width: 74, height: 20, borderRadius: 999 }} />
      </div>

      <div className="ui-skeleton ui-skeleton-text" style={{ width: "72%", height: 12, marginTop: 18 }} />
      <div className="ui-skeleton ui-skeleton-text" style={{ width: "48%", height: 12 }} />

      <div className="report-card-actions" style={{ marginTop: 18 }}>
        <div className="ui-skeleton" style={{ width: 104, height: 31, borderRadius: 10 }} />
        <div className="ui-skeleton" style={{ width: 90, height: 31, borderRadius: 10 }} />
      </div>
    </article>
  );
}

export default ReportSkeleton;
