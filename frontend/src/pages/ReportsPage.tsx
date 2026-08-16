function ReportsPage() {
  const reports = [
    {
      title: "Ohm's Law Quiz",
      type: "Quiz",
      score: "80%",
      result: "4 / 5 Correct",
      status: "Completed",
    },
    {
      title: "Series Circuit",
      type: "Experiment",
      score: "90%",
      result: "Completed",
      status: "Completed",
    },
    {
      title: "Electrical Fundamentals",
      type: "Assessment",
      score: "75%",
      result: "15 / 20 Correct",
      status: "Completed",
    },
  ];

  return (
    <div
      style={{
        maxWidth: "1150px",
        margin: "0 auto",
        padding: "40px 30px",
        color: "#ffffff",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            color: "#8b5cf6",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "1px",
            marginBottom: "10px",
          }}
        >
          ENGINEEROS • REPORTS
        </div>

        <h1
          style={{
            fontSize: "40px",
            margin: "0 0 10px",
          }}
        >
          Learning Reports
        </h1>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "17px",
            margin: 0,
          }}
        >
          Track your experiment, quiz, and assessment performance.
        </p>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            background: "#111522",
            border: "1px solid #292d3b",
            borderRadius: "14px",
            padding: "22px",
          }}
        >
          <div style={{ color: "#9ca3af", fontSize: "14px" }}>
            Experiments Completed
          </div>

          <div
            style={{
              fontSize: "30px",
              fontWeight: 800,
              marginTop: "8px",
            }}
          >
            1
          </div>
        </div>

        <div
          style={{
            background: "#111522",
            border: "1px solid #292d3b",
            borderRadius: "14px",
            padding: "22px",
          }}
        >
          <div style={{ color: "#9ca3af", fontSize: "14px" }}>
            Quizzes Completed
          </div>

          <div
            style={{
              fontSize: "30px",
              fontWeight: 800,
              marginTop: "8px",
            }}
          >
            1
          </div>
        </div>

        <div
          style={{
            background: "#111522",
            border: "1px solid #292d3b",
            borderRadius: "14px",
            padding: "22px",
          }}
        >
          <div style={{ color: "#9ca3af", fontSize: "14px" }}>
            Average Score
          </div>

          <div
            style={{
              fontSize: "30px",
              fontWeight: 800,
              marginTop: "8px",
              color: "#a78bfa",
            }}
          >
            80%
          </div>
        </div>
      </div>

      {/* Reports */}
      <div
        style={{
          background: "#0f121c",
          border: "1px solid #292d3b",
          borderRadius: "18px",
          padding: "26px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Recent Activity
        </h2>

        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          {reports.map((report, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 1fr) 130px 130px 130px",
                alignItems: "center",
                gap: "15px",
                padding: "18px",
                background: "#111522",
                border: "1px solid #292d3b",
                borderRadius: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                  }}
                >
                  {report.title}
                </div>

                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "13px",
                    marginTop: "5px",
                  }}
                >
                  {report.type}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                  }}
                >
                  Score
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    marginTop: "4px",
                  }}
                >
                  {report.score}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                  }}
                >
                  Result
                </div>

                <div
                  style={{
                    fontWeight: 600,
                    marginTop: "4px",
                  }}
                >
                  {report.result}
                </div>
              </div>

              <div
                style={{
                  color: "#22c55e",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                ✓ {report.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;