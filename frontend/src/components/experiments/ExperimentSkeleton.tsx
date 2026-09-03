import Card from "../ui/Card";

function ExperimentSkeleton() {
  return (
    <Card className="exp-skeleton">
      <div className="exp-skeleton-top">
        <div className="ui-skeleton ui-skeleton-circular" style={{ width: 32, height: 32 }} />
        <div className="ui-skeleton ui-skeleton-text" style={{ width: 64, height: 20 }} />
      </div>
      <div className="ui-skeleton ui-skeleton-text" style={{ width: "70%", height: 18, marginTop: 12 }} />
      <div className="ui-skeleton ui-skeleton-text" style={{ width: "95%", height: 12, marginTop: 8 }} />
      <div className="ui-skeleton ui-skeleton-text" style={{ width: "60%", height: 12, marginTop: 4 }} />
      <div className="exp-skeleton-meta">
        <div className="ui-skeleton ui-skeleton-text" style={{ width: 80, height: 16 }} />
        <div className="ui-skeleton ui-skeleton-text" style={{ width: 60, height: 14 }} />
      </div>
    </Card>
  );
}

export default ExperimentSkeleton;
