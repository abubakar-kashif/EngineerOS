import { useState } from "react";
import { FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { createReport } from "../../services/reports/reportsService";

interface MeasurementRow {
  id: number;
  measurement: string;
  value: string;
  unit: string;
  description: string;
}

const SUGGESTED_ROWS: Record<string, Omit<MeasurementRow, "id" | "value">[]> = {
  "rc-circuit": [
    { measurement: "Vin", unit: "V", description: "Source voltage" },
    { measurement: "Vc", unit: "V", description: "Capacitor voltage" },
    { measurement: "R", unit: "Ω", description: "Resistance" },
    { measurement: "C", unit: "F", description: "Capacitance" },
    { measurement: "tau", unit: "s", description: "Time constant" },
  ],
  "capacitor-charging": [
    { measurement: "Vin", unit: "V", description: "Source voltage" },
    { measurement: "Vc", unit: "V", description: "Capacitor voltage" },
    { measurement: "R", unit: "Ω", description: "Resistance" },
    { measurement: "C", unit: "F", description: "Capacitance" },
    { measurement: "tau", unit: "s", description: "Time constant" },
  ],
  "rc-low-pass-filter": [
    { measurement: "Vin", unit: "V", description: "Input peak" },
    { measurement: "Vout", unit: "V", description: "Output peak" },
    { measurement: "R", unit: "Ω", description: "Resistance" },
    { measurement: "C", unit: "F", description: "Capacitance" },
    { measurement: "f", unit: "Hz", description: "Source frequency" },
    { measurement: "fc", unit: "Hz", description: "Cutoff frequency" },
  ],
  "rl-circuit": [
    { measurement: "Vin", unit: "V", description: "Source voltage" },
    { measurement: "I", unit: "A", description: "Current" },
    { measurement: "R", unit: "Ω", description: "Resistance" },
    { measurement: "L", unit: "H", description: "Inductance" },
    { measurement: "tau", unit: "s", description: "Time constant" },
  ],
  "rlc-circuit": [
    { measurement: "R", unit: "Ω", description: "Resistance" },
    { measurement: "L", unit: "H", description: "Inductance" },
    { measurement: "C", unit: "F", description: "Capacitance" },
    { measurement: "f", unit: "Hz", description: "Frequency" },
    { measurement: "V", unit: "V", description: "Voltage" },
    { measurement: "I", unit: "A", description: "Current" },
  ],
  "series-resonance": [
    { measurement: "f0", unit: "Hz", description: "Resonant frequency" },
    { measurement: "BW", unit: "Hz", description: "Bandwidth" },
    { measurement: "Q", unit: "", description: "Quality factor" },
    { measurement: "I", unit: "A", description: "Current" },
    { measurement: "Z", unit: "Ω", description: "Impedance" },
  ],
  "half-wave-rectifier": [
    { measurement: "Vin peak", unit: "V", description: "Input peak" },
    { measurement: "Vout peak", unit: "V", description: "Output peak" },
    { measurement: "Vavg", unit: "V", description: "Average output" },
    { measurement: "ripple", unit: "V", description: "Ripple" },
    { measurement: "f", unit: "Hz", description: "Frequency" },
  ],
  "full-wave-bridge-rectifier": [
    { measurement: "Vin peak", unit: "V", description: "Input peak" },
    { measurement: "Vout peak", unit: "V", description: "Output peak" },
    { measurement: "Vavg", unit: "V", description: "Average output" },
    { measurement: "f ripple", unit: "Hz", description: "Ripple frequency" },
  ],
  "thevenin-theorem": [
    { measurement: "Vth", unit: "V", description: "Thevenin voltage" },
    { measurement: "Rth", unit: "Ω", description: "Thevenin resistance" },
    { measurement: "RL", unit: "Ω", description: "Load resistance" },
    { measurement: "VL", unit: "V", description: "Load voltage" },
  ],
  "norton-theorem": [
    { measurement: "In", unit: "A", description: "Norton current" },
    { measurement: "Rn", unit: "Ω", description: "Norton resistance" },
    { measurement: "RL", unit: "Ω", description: "Load resistance" },
    { measurement: "IL", unit: "A", description: "Load current" },
  ],
  "maximum-power-transfer": [
    { measurement: "RL", unit: "Ω", description: "Load resistance" },
    { measurement: "PL", unit: "W", description: "Load power" },
  ],
  potentiometer: [
    { measurement: "position", unit: "", description: "Wiper position" },
    { measurement: "Vout", unit: "V", description: "Output voltage" },
    { measurement: "Vin", unit: "V", description: "Input voltage" },
  ],
  "wheatstone-bridge": [
    { measurement: "Vbridge", unit: "V", description: "Bridge voltage" },
    { measurement: "R1", unit: "Ω", description: "Arm R1" },
    { measurement: "R2", unit: "Ω", description: "Arm R2" },
  ],
  "superposition-theorem": [
    { measurement: "V1 only", unit: "V", description: "Contribution of source 1" },
    { measurement: "V2 only", unit: "V", description: "Contribution of source 2" },
    { measurement: "V total", unit: "V", description: "Combined response" },
  ],
};

const DEFAULT_ROWS: Omit<MeasurementRow, "id" | "value">[] = [
  { measurement: "V", unit: "V", description: "Voltage" },
  { measurement: "I", unit: "A", description: "Current" },
  { measurement: "R", unit: "Ω", description: "Resistance" },
];

function starterRows(experimentId: string): MeasurementRow[] {
  const template = SUGGESTED_ROWS[experimentId] ?? DEFAULT_ROWS;
  return template.map((row, index) => ({ ...row, id: index + 1, value: "" }));
}

interface ReportCTAProps {
  experimentId: string;
  experimentTitle: string;
}

function ReportCTA({ experimentId, experimentTitle }: ReportCTAProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [observations, setObservations] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [rows, setRows] = useState<MeasurementRow[]>(() => starterRows(experimentId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(id: number, patch: Partial<MeasurementRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function handleGenerate() {
    setSubmitting(true);
    setError(null);
    const entered = rows.filter((row) => row.value.trim() && row.measurement.trim());
    const measuredBlock = entered.length
      ? [
          "User-entered measurements (not theoretical, not simulated)",
          ...entered.map(
            (row) =>
              `${row.measurement.trim()}: ${row.value.trim()} ${row.unit.trim()} — ${row.description.trim()}`,
          ),
        ].join("\n")
      : "";
    const observationText = [observations.trim(), measuredBlock].filter(Boolean).join("\n\n");
    try {
      const report = await createReport({
        experiment_id: experimentId,
        title: `Lab Report — ${experimentTitle}`,
        observations: observationText,
        conclusion: conclusion.trim(),
      });
      navigate(`/reports/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate the report.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="detail-cta-card detail-cta-report">
      <div className="detail-cta">
        <FileText size={24} className="detail-cta-icon" />
        <p className="eyebrow">DOCUMENT YOUR WORK</p>
        <h2 className="detail-cta-title">Generate Report</h2>
        <p className="detail-cta-desc">
          Create a professional lab report with your observations and conclusion.
          {!isAuthenticated &&
            " Sign in to attach your simulation measurements and quiz results."}
        </p>
        <div className="report-cta-form">
          <div className="ui-field">
            <p className="ui-field-label">Your measurements</p>
            <p className="detail-cta-desc">
              These rows stay blank until you type a value. They are labeled user-entered, separate from theoretical and simulated results.
            </p>
            {rows.map((row) => (
              <div key={row.id} className="report-measure-row">
                <input
                  aria-label="Measurement name"
                  value={row.measurement}
                  onChange={(event) => updateRow(row.id, { measurement: event.target.value })}
                />
                <input
                  aria-label={`${row.measurement || "Measurement"} value`}
                  inputMode="decimal"
                  value={row.value}
                  placeholder="Value"
                  onChange={(event) => updateRow(row.id, { value: event.target.value })}
                />
                <input
                  aria-label={`${row.measurement || "Measurement"} unit`}
                  value={row.unit}
                  onChange={(event) => updateRow(row.id, { unit: event.target.value })}
                />
                <input
                  aria-label={`${row.measurement || "Measurement"} description`}
                  value={row.description}
                  onChange={(event) => updateRow(row.id, { description: event.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                >
                  Remove
                </button>
              </div>
            ))}
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                setRows((current) => [
                  ...current,
                  {
                    id: (current.at(-1)?.id ?? 0) + 1,
                    measurement: "",
                    value: "",
                    unit: "",
                    description: "",
                  },
                ])
              }
            >
              Add measurement
            </Button>
          </div>
          <div className="ui-field">
            <label htmlFor="report-observations" className="ui-field-label">
              Observations
            </label>
            <textarea
              id="report-observations"
              className="ui-textarea"
              placeholder="What did you observe during the experiment?"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              maxLength={10000}
            />
          </div>
          <div className="ui-field">
            <label htmlFor="report-conclusion" className="ui-field-label">
              Conclusion
            </label>
            <textarea
              id="report-conclusion"
              className="ui-textarea"
              placeholder="What did you conclude from the results?"
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              rows={3}
              maxLength={10000}
            />
          </div>
          {error && (
            <p className="report-cta-error" role="alert">
              {error}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            loading={submitting}
            icon={<ArrowRight size={16} />}
            iconPosition="right"
          >
            {submitting ? "Generating…" : "Generate Report"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ReportCTA;
