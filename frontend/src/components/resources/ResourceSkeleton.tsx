/** Grid of skeleton cards matching the resources page layout. */
function ResourceSkeleton() {
  return (
    <div className="resources-grid" aria-busy="true" aria-label="Loading resources">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="resource-card resource-card-skeleton">
          <div className="resource-card-head">
            <span className="ui-skeleton ui-skeleton-circular" style={{ width: 34, height: 34 }} />
            <span className="ui-skeleton ui-skeleton-text" style={{ width: 90 }} />
          </div>
          <span className="ui-skeleton ui-skeleton-text" style={{ width: "80%", height: 16 }} />
          <span className="ui-skeleton ui-skeleton-text" style={{ width: "100%" }} />
          <span className="ui-skeleton ui-skeleton-text" style={{ width: "60%" }} />
          <span className="ui-skeleton ui-skeleton-rectangular" style={{ width: 120, height: 30 }} />
        </div>
      ))}
    </div>
  );
}

export default ResourceSkeleton;
