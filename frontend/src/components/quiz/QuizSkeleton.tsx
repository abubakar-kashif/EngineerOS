function QuizSkeleton() {
  return (
    <div className="quiz-skeleton" aria-hidden="true">
      <div className="ui-skeleton ui-skeleton-text" style={{ width: 220, height: 12 }} />
      <div className="ui-skeleton ui-skeleton-text" style={{ width: "60%", height: 28, marginTop: 10 }} />
      <div className="ui-skeleton ui-skeleton-text" style={{ width: "45%", height: 12, marginTop: 8 }} />

      <div className="ui-skeleton" style={{ height: 22, borderRadius: 999, marginTop: 22 }} />

      <div className="quiz-skeleton-card">
        <div className="ui-skeleton ui-skeleton-text" style={{ width: 130, height: 12 }} />
        <div className="ui-skeleton ui-skeleton-text" style={{ width: "78%", height: 20, marginTop: 16 }} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="ui-skeleton" style={{ height: 54, borderRadius: 12, marginTop: 12 }} />
        ))}
      </div>

      <div className="quiz-skeleton-nav">
        <div className="ui-skeleton" style={{ width: 110, height: 39, borderRadius: 10 }} />
        <div className="ui-skeleton" style={{ width: 130, height: 39, borderRadius: 10 }} />
      </div>
    </div>
  );
}

export default QuizSkeleton;
