import { useState } from "react";
import { useParams } from "react-router-dom";

function WorkspacePage() {
  const { experimentId } = useParams();

  const [activeTab, setActiveTab] = useState("Theory");
  const [running, setRunning] = useState(false);

  const tabs = ["Theory", "Circuit Setup", "Simulation", "Results", "Quiz"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        color: "#f5f5f5",
        padding: "32px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <p
              style={{
                color: "#9b7cff",
                margin: "0 0 8px",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ENGINEEROS • EXPERIMENT WORKSPACE
            </p>

            <h1 style={{ margin: 0, fontSize: "32px" }}>
              Engineering Workspace
            </h1>

            <p style={{ color: "#9ca3af", marginTop: "8px" }}>
              Experiment ID: {experimentId || "Not selected"}
            </p>
          </div>

          <div
            style={{
              padding: "10px 16px",
              border: "1px solid #2d3340",
              borderRadius: "10px",
              color: "#aab2c0",
            }}
          >
            Ready
          </div>
        </div>

        {/* Workflow */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "11px 18px",
                borderRadius: "9px",
                border: "1px solid #303746",
                background:
                  activeTab === tab ? "#7c3aed" : "#181c25",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Workspace */}
        <div
          style={{
            background: "#151922",
            border: "1px solid #292f3b",
            borderRadius: "16px",
            padding: "28px",
          }}
        >
          {activeTab === "Theory" && (
            <section>
              <h2>Experiment Theory</h2>

              <p style={{ color: "#aeb6c4", lineHeight: 1.7 }}>
                Understand the electrical engineering concept before building
                the circuit.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  marginTop: "25px",
                }}
              >
                <InfoCard
                  title="Objective"
                  text="Understand the purpose and working principle of the experiment."
                />

                <InfoCard
                  title="Components"
                  text="Identify the electrical components required for the experiment."
                />

                <InfoCard
                  title="Key Formula"
                  text="Important equations and engineering relationships will appear here."
                />
              </div>
            </section>
          )}

          {activeTab === "Circuit Setup" && (
            <section>
              <h2>Circuit Setup</h2>

              <p style={{ color: "#aeb6c4" }}>
                Build and connect the electrical circuit here.
              </p>

              <div
                style={{
                  marginTop: "25px",
                  minHeight: "380px",
                  border: "1px dashed #444c5c",
                  borderRadius: "14px",
                  background: "#0c0f14",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Voltage Source */}
                <CircuitBlock
                  title="DC Source"
                  value="12V"
                  left="8%"
                  top="38%"
                />

                {/* Resistor */}
                <CircuitBlock
                  title="Resistor"
                  value="1kΩ"
                  left="38%"
                  top="38%"
                />

                {/* Load */}
                <CircuitBlock
                  title="Load"
                  value="Lamp"
                  left="68%"
                  top="38%"
                />

                <div
                  style={{
                    position: "absolute",
                    left: "18%",
                    top: "46%",
                    width: "20%",
                    height: "2px",
                    background: "#7c3aed",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "48%",
                    top: "46%",
                    width: "20%",
                    height: "2px",
                    background: "#7c3aed",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: "10%",
                    bottom: "18%",
                    color: "#6f7888",
                    fontSize: "13px",
                  }}
                >
                  Circuit Builder — Simulation-ready interface
                </div>
              </div>
            </section>
          )}

          {activeTab === "Simulation" && (
            <section>
              <h2>Simulation</h2>

              <p style={{ color: "#aeb6c4" }}>
                Run the circuit and calculate electrical values.
              </p>

              <button
                onClick={() => setRunning(!running)}
                style={{
                  marginTop: "20px",
                  padding: "12px 22px",
                  border: "none",
                  borderRadius: "9px",
                  background: running ? "#dc2626" : "#7c3aed",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {running ? "Stop Simulation" : "Run Simulation"}
              </button>

              <div
                style={{
                  marginTop: "25px",
                  padding: "20px",
                  background: "#0c0f14",
                  borderRadius: "12px",
                  border: "1px solid #292f3b",
                }}
              >
                <h3>Simulation Status</h3>

                <p style={{ color: running ? "#4ade80" : "#9ca3af" }}>
                  {running
                    ? "Simulation running..."
                    : "Simulation is ready to start."}
                </p>
              </div>
            </section>
          )}

          {activeTab === "Results" && (
            <section>
              <h2>Simulation Results</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "16px",
                  marginTop: "25px",
                }}
              >
                <ResultCard label="Voltage" value="12 V" />
                <ResultCard label="Current" value="12 mA" />
                <ResultCard label="Resistance" value="1 kΩ" />
                <ResultCard label="Power" value="0.144 W" />
              </div>
            </section>
          )}

          {activeTab === "Quiz" && (
            <section>
              <h2>Experiment Quiz</h2>

              <p style={{ color: "#aeb6c4" }}>
                Test your understanding after completing the experiment.
              </p>

              <div
                style={{
                  marginTop: "25px",
                  padding: "22px",
                  background: "#0c0f14",
                  borderRadius: "12px",
                  border: "1px solid #292f3b",
                }}
              >
                <h3>Question 1</h3>

                <p>What is the relationship between voltage, current and resistance?</p>

                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    marginTop: "18px",
                  }}
                >
                  <button className="workspace-option">V = IR</button>
                  <button className="workspace-option">P = VI</button>
                  <button className="workspace-option">I = PR</button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        padding: "20px",
        background: "#0c0f14",
        border: "1px solid #292f3b",
        borderRadius: "12px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function CircuitBlock({
  title,
  value,
  left,
  top,
}: {
  title: string;
  value: string;
  left: string;
  top: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transform: "translate(-50%, -50%)",
        width: "120px",
        padding: "16px",
        background: "#181c25",
        border: "1px solid #7c3aed",
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <strong>{title}</strong>
      <div style={{ color: "#9ca3af", marginTop: "6px" }}>{value}</div>
    </div>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "20px",
        background: "#0c0f14",
        border: "1px solid #292f3b",
        borderRadius: "12px",
      }}
    >
      <div style={{ color: "#9ca3af", fontSize: "14px" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "8px" }}>
        {value}
      </div>
    </div>
  );
}

export default WorkspacePage;