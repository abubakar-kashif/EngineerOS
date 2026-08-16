import { useMemo } from "react";

type Activity = {
  title: string;
  type: "Experiment" | "Quiz" | "Assessment";
  score: number;
  result: string;
};

function DashboardPage() {
  const activities: Activity[] = [
    {
      title: "Series Circuit",
      type: "Experiment",
      score: 90,
      result: "Completed",
    },
    {
      title: "Ohm's Law Quiz",
      type: "Quiz",
      score: 80,
      result: "4 / 5 Correct",
    },
    {
      title: "Electrical Fundamentals",
      type: "Assessment",
      score: 75,
      result: "15 / 20 Correct",
    },
  ];

  const stats = useMemo(() => {
    const experiments = activities.filter(
      (item) => item.type === "Experiment"
    ).length;

    const quizzes = activities.filter(
      (item) => item.type === "Quiz"
    ).length;

    const average = Math.round(
      activities.reduce((sum, item) => sum + item.score, 0) /
        activities.length
    );

    return {
      experiments,
      quizzes,
      average,
    };
  }, []);

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
          ENGINEEROS • DASHBOARD
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "0 0 12px",
          }}
        >
          Learning Dashboard
        </h1>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "17px",
            margin: 0,
          }}
        >
          Track your electrical engineering learning progress and activity.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            background: "#111522",
            border: "1px solid #292d3b",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ fontSize: "26px", marginBottom: "12px" }}>
            🧪
          </div>

          <div
            style={{
              color: "#9ca3af",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Experiments Completed
          </div>

          <div
            style={{
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            {stats.experiments}
          </div>
        </div>

        <div
          style={{
            background: "#111522",
            border: "1px solid #292d3b",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ fontSize: "26px", marginBottom: "12px" }}>
            📝
          </div>

          <div
            style={{
              color: "#9ca3af",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Quizzes Completed
          </div>

          <div
            style={{
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            {stats.quizzes}
          </div>
        </div>

        <div
          style={{
            background: "#111522",
            border: "1px solid #292d3b",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ fontSize: "26px", marginBottom: "12px" }}>
            🎯
          </div>

          <div
            style={{
              color: "#9ca3af",
              fontSize: "14px",
              marginBottom: "8px",
            }}
          >
            Average Score
          </div>

          <div
            style={{
              fontSize: "34px",
              fontWeight: 700,
              color: "#a78bfa",
            }}
          >
            {stats.average}%
          </div>
        </div>
      </div>

      {/* Progress */}
      <div
        style={{
          background: "#0f121c",
          border: "1px solid #292d3b",
          borderRadius: "18px",
          padding: "26px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Learning Progress
        </h2>

        <p
          style={{
            color: "#9ca3af",
            marginTop: "-5px",
          }}
        >
          Your overall engineering learning progress.
        </p>

        <div
          style={{
            height: "12px",
            background: "#242938",
            borderRadius: "20px",
            overflow: "hidden",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              width: `${stats.average}%`,
              height: "100%",
              background: "#7c3aed",
              borderRadius: "20px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10px",
            color: "#9ca3af",
            fontSize: "14px",
          }}
        >
          <span>Overall Progress</span>
          <strong style={{ color: "#ffffff" }}>
            {stats.average}%
          </strong>
        </div>
      </div>

      {/* Recent Activity */}
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
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          {activities.map((activity) => (
            <div
              key={activity.title}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px, 2fr) 1fr 1fr 1fr",
                alignItems: "center",
                gap: "20px",
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
                    marginBottom: "5px",
                  }}
                >
                  {activity.title}
                </div>

                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "13px",
                  }}
                >
                  {activity.type}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  Score
                </div>

                <strong>{activity.score}%</strong>
              </div>

              <div>
                <div
                  style={{
                    color: "#9ca3af",
                    fontSize: "12px",
                    marginBottom: "4px",
                  }}
                >
                  Result
                </div>

                <strong>{activity.result}</strong>
              </div>

              <div
                style={{
                  color: "#22c55e",
                  fontWeight: 700,
                }}
              >
                ✓ Completed
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;