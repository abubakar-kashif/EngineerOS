import { useState } from "react";

type MentorMode =
  | "question"
  | "concept"
  | "equation"
  | "troubleshoot"
  | "experiment";

function MentorPage() {
  const [mode, setMode] = useState<MentorMode>("question");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [imageName, setImageName] = useState("");

  const modeTitles: Record<MentorMode, string> = {
    question: "Ask a Question",
    concept: "Explain a Concept",
    equation: "Solve an Equation",
    troubleshoot: "Troubleshoot a Machine",
    experiment: "Experiment Help",
  };

  const getNumber = (text: string, patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return Number(match[1]);
    }
    return null;
  };

  const getAnswer = () => {
    if (!question.trim() && !imageName) {
      setAnswer("Please enter a question or upload an image.");
      return;
    }

    const q = question.toLowerCase();

    // ---------------- OHM'S LAW ----------------

    const voltage = getNumber(q, [
      /v\s*=\s*([\d.]+)\s*v?/i,
      /voltage\s*(?:is|=)?\s*([\d.]+)\s*v?/i,
      /([\d.]+)\s*v\s*(?:voltage)?/i,
    ]);

    const current = getNumber(q, [
      /i\s*=\s*([\d.]+)\s*a?/i,
      /current\s*(?:is|=)?\s*([\d.]+)\s*a?/i,
      /([\d.]+)\s*a\s*(?:current)?/i,
    ]);

    const resistance = getNumber(q, [
      /r\s*=\s*([\d.]+)\s*(?:ohm|Ω)?/i,
      /resistance\s*(?:is|=)?\s*([\d.]+)\s*(?:ohm|Ω)?/i,
      /([\d.]+)\s*(?:ohm|Ω)/i,
    ]);

    if (
      q.includes("current") &&
      voltage !== null &&
      resistance !== null &&
      resistance !== 0
    ) {
      const result = voltage / resistance;

      setAnswer(
        `Ohm's Law — Current Calculation

Formula:
I = V / R

Given:
V = ${voltage} V
R = ${resistance} Ω

Calculation:
I = ${voltage} / ${resistance}
I = ${result} A

Therefore, the current is ${result} A.`
      );
      return;
    }

    if (
      q.includes("voltage") &&
      current !== null &&
      resistance !== null
    ) {
      const result = current * resistance;

      setAnswer(
        `Ohm's Law — Voltage Calculation

Formula:
V = I × R

Given:
I = ${current} A
R = ${resistance} Ω

Calculation:
V = ${current} × ${resistance}
V = ${result} V

Therefore, the voltage is ${result} V.`
      );
      return;
    }

    if (
      q.includes("resistance") &&
      voltage !== null &&
      current !== null &&
      current !== 0
    ) {
      const result = voltage / current;

      setAnswer(
        `Ohm's Law — Resistance Calculation

Formula:
R = V / I

Given:
V = ${voltage} V
I = ${current} A

Calculation:
R = ${voltage} / ${current}
R = ${result} Ω

Therefore, the resistance is ${result} Ω.`
      );
      return;
    }

    // ---------------- CONCEPTS ----------------

    if (q.includes("ohm")) {
      setAnswer(
        `Ohm's Law

Ohm's Law describes the relationship between voltage, current and resistance.

Formula:

V = I × R

Where:

V = Voltage
I = Current
R = Resistance

The other forms are:

I = V / R
R = V / I

Example:

If V = 12 V and R = 6 Ω:

I = V / R
I = 12 / 6
I = 2 A

Therefore, the current is 2 A.`
      );
      return;
    }

    if (q.includes("transformer")) {
      setAnswer(
        `Transformer

A transformer transfers electrical energy from one circuit to another using electromagnetic induction.

Main parts:

• Primary winding
• Secondary winding
• Magnetic core

Step-up transformer:
Increases voltage.

Step-down transformer:
Decreases voltage.

The ideal transformer relationship is:

Vp / Vs = Np / Ns`
      );
      return;
    }

    if (q.includes("generator")) {
      setAnswer(
        `Electrical Generator

A generator converts mechanical energy into electrical energy.

It works mainly on the principle of electromagnetic induction.

Important factors include:

• Magnetic flux
• Speed of rotation
• Number of conductors

The generated EMF depends on these operating conditions.`
      );
      return;
    }

    // ---------------- MOTOR TROUBLESHOOTING ----------------

    if (
      q.includes("motor") ||
      mode === "troubleshoot"
    ) {
      setAnswer(
        `Motor Troubleshooting

If a motor is not running, possible causes include:

1. No power supply
2. Loose or incorrect connections
3. Fuse/MCB/protection issue
4. Overload condition
5. Fault in the motor winding
6. Starting circuit problem

For practical equipment, testing should be performed using proper electrical safety procedures.`
      );
      return;
    }

    // ---------------- FALLBACK ----------------

    setAnswer(
      `Mentor Analysis

Mode: ${modeTitles[mode]}

Your question has been received.

For supported electrical calculations, provide the known values clearly.

Example:

"Calculate current when V = 12V and R = 6Ω"

The mentor can then calculate:

I = V / R
I = 12 / 6
I = 2 A

${
  imageName
    ? `

Uploaded image:
${imageName}

Image analysis will be connected to the AI backend in the next stage.`
    : ""
}`
    );
  };

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    setImageName(file.name);
  };

  return (
    <div
      style={{
        maxWidth: "1150px",
        margin: "0 auto",
        padding: "40px 30px",
        color: "#ffffff",
      }}
    >
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            color: "#8b5cf6",
            fontSize: "14px",
            fontWeight: 700,
            marginBottom: "10px",
            letterSpacing: "1px",
          }}
        >
          ENGINEEROS • AI MENTOR
        </div>

        <h1
          style={{
            fontSize: "42px",
            margin: "0 0 12px",
          }}
        >
          Electrical Engineering AI Mentor
        </h1>

        <p
          style={{
            color: "#9ca3af",
            fontSize: "17px",
            margin: 0,
          }}
        >
          Learn concepts, solve engineering problems and troubleshoot electrical
          systems with guided assistance.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginBottom: "28px",
        }}
      >
        {(
          [
            ["question", "💬", "Ask Question"],
            ["concept", "💡", "Explain Concept"],
            ["equation", "🧮", "Solve Equation"],
            ["troubleshoot", "⚙️", "Troubleshoot"],
            ["experiment", "🧪", "Experiment Help"],
          ] as [MentorMode, string, string][]
        ).map(([key, icon, title]) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              setAnswer("");
            }}
            style={{
              textAlign: "left",
              padding: "18px",
              minHeight: "105px",
              borderRadius: "14px",
              border:
                mode === key
                  ? "1px solid #8b5cf6"
                  : "1px solid #292d3b",
              background:
                mode === key ? "#241447" : "#111522",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: "23px",
                marginBottom: "8px",
              }}
            >
              {icon}
            </div>

            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {title}
            </div>

            <div
              style={{
                color: "#9ca3af",
                fontSize: "13px",
                marginTop: "5px",
              }}
            >
              {key === "question" &&
                "Ask any electrical engineering question."}

              {key === "concept" &&
                "Understand difficult concepts simply."}

              {key === "equation" &&
                "Get step-by-step numerical solutions."}

              {key === "troubleshoot" &&
                "Find possible causes of machine problems."}

              {key === "experiment" &&
                "Get guidance for engineering experiments."}
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#0f121c",
          border: "1px solid #292d3b",
          borderRadius: "18px",
          padding: "28px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {modeTitles[mode]}
        </h2>

        <p
          style={{
            color: "#9ca3af",
            marginTop: "-8px",
            marginBottom: "18px",
          }}
        >
          Enter your problem below and ask the engineering mentor.
        </p>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            mode === "equation"
              ? "Example: Calculate current when V = 12V and R = 6Ω..."
              : mode === "troubleshoot"
              ? "Example: My DC motor is not starting. What should I check?"
              : mode === "concept"
              ? "Example: Explain electromagnetic induction..."
              : mode === "experiment"
              ? "Example: Explain the procedure of this experiment..."
              : "Example: Calculate current when V = 12V and R = 6Ω..."
          }
          rows={7}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #363b4b",
            background: "#080b12",
            color: "#ffffff",
            fontSize: "16px",
            resize: "vertical",
            outline: "none",
          }}
        />

        <div
          style={{
            marginTop: "16px",
            padding: "18px",
            border: "1px dashed #454b60",
            borderRadius: "12px",
            background: "#0b0e16",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            🖼️ Upload a question or circuit image
          </div>

          <div
            style={{
              color: "#8f96a8",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            Image analysis will be connected to the AI backend next.
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              handleImage(e.target.files?.[0])
            }
          />

          {imageName && (
            <div
              style={{
                marginTop: "10px",
                color: "#a78bfa",
                fontSize: "14px",
              }}
            >
              Selected: {imageName}
            </div>
          )}
        </div>

        <button
          onClick={getAnswer}
          style={{
            marginTop: "18px",
            padding: "14px 28px",
            borderRadius: "10px",
            border: "none",
            background: "#7c3aed",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Ask Mentor
        </button>

        {answer && (
          <div
            style={{
              marginTop: "26px",
              padding: "24px",
              background: "#111522",
              border: "1px solid #292d3b",
              borderRadius: "14px",
              whiteSpace: "pre-line",
              lineHeight: 1.7,
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "#ffffff",
              }}
            >
              🤖 Mentor Response
            </h3>

            <div
              style={{
                color: "#d1d5db",
                fontSize: "15px",
              }}
            >
              {answer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MentorPage;