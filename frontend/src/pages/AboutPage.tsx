function AboutPage() {
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
      <div style={{ marginBottom: "35px" }}>
        <div
          style={{
            color: "#8b5cf6",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "1px",
            marginBottom: "10px",
          }}
        >
          ENGINEEROS • ABOUT
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "0 0 14px",
          }}
        >
          About EngineerOS
        </h1>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "17px",
            lineHeight: 1.7,
            maxWidth: "800px",
          }}
        >
          EngineerOS is an interactive electrical engineering learning
          platform designed to help students learn concepts, perform
          experiments, solve problems, and improve their engineering skills
          in one place.
        </p>
      </div>

      {/* Mission */}
      <div
        style={{
          background: "#0f121c",
          border: "1px solid #292d3b",
          borderRadius: "18px",
          padding: "30px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            color: "#8b5cf6",
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "1px",
            marginBottom: "10px",
          }}
        >
          OUR MISSION
        </div>

        <h2 style={{ marginTop: 0 }}>
          Making Electrical Engineering Easier to Understand
        </h2>

        <p
          style={{
            color: "#9ca3af",
            lineHeight: 1.8,
            marginBottom: 0,
          }}
        >
          EngineerOS brings theory, practical experiments, simulations,
          quizzes, engineering tools, and guided assistance together in a
          single learning environment.
        </p>
      </div>

      {/* Features */}
      <div style={{ marginBottom: "24px" }}>
        <h2>What EngineerOS Provides</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginTop: "18px",
          }}
        >
          {[
            {
              icon: "📚",
              title: "Learn",
              text: "Understand electrical engineering concepts and theoretical foundations.",
            },
            {
              icon: "🧪",
              title: "Experiment",
              text: "Learn through practical electrical engineering experiments.",
            },
            {
              icon: "🤖",
              title: "AI Mentor",
              text: "Get guided help with concepts, equations, and engineering problems.",
            },
            {
              icon: "🧮",
              title: "Calculate",
              text: "Use engineering calculators for common electrical quantities.",
            },
            {
              icon: "📝",
              title: "Quiz",
              text: "Test your knowledge and measure your understanding.",
            },
            {
              icon: "📊",
              title: "Track Progress",
              text: "Monitor learning activity, scores, and completed work.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                background: "#111522",
                border: "1px solid #292d3b",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "12px",
                }}
              >
                {feature.icon}
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                }}
              >
                {feature.title}
              </h3>

              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div
        style={{
          background: "#111522",
          border: "1px solid #292d3b",
          borderRadius: "18px",
          padding: "30px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          Learn. Build. Understand.
        </h2>

        <p
          style={{
            color: "#9ca3af",
            lineHeight: 1.8,
            marginBottom: 0,
          }}
        >
          Our goal is to create a focused learning environment where
          electrical engineering students can move from theoretical
          understanding to practical problem solving.
        </p>
      </div>
    </div>
  );
}

export default AboutPage;