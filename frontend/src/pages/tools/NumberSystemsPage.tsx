import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SectionHeading from "../../components/ui/SectionHeading";
import { convertNumberBase, type NumberBase } from "../../services/tools/numberSystems";

const BASES: { id: NumberBase; label: string }[] = [
  { id: "binary", label: "Binary" },
  { id: "octal", label: "Octal" },
  { id: "decimal", label: "Decimal" },
  { id: "hexadecimal", label: "Hexadecimal" },
];

function NumberSystemsPage() {
  const [from, setFrom] = useState<NumberBase>("binary");
  const [to, setTo] = useState<NumberBase>("decimal");
  const [value, setValue] = useState("1010");
  const [result, setResult] = useState("10");
  const [error, setError] = useState<string | null>(null);

  const convert = (nextValue: string, nextFrom: NumberBase, nextTo: NumberBase) => {
    try {
      setResult(convertNumberBase(nextValue, nextFrom, nextTo));
      setError(null);
    } catch (cause) {
      setResult("");
      setError(cause instanceof Error ? cause.message : "Invalid value");
    }
  };

  return (
    <main className="page">
      <SectionHeading
        eyebrow="Tools"
        title="Number systems"
        description="Convert integers between binary, octal, decimal, and hexadecimal."
      />
      <label>
        From
        <select
          value={from}
          aria-label="Source base"
          onChange={(event) => {
            const next = event.target.value as NumberBase;
            setFrom(next);
            convert(value, next, to);
          }}
        >
          {BASES.map((base) => (
            <option key={base.id} value={base.id}>
              {base.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        To
        <select
          value={to}
          aria-label="Target base"
          onChange={(event) => {
            const next = event.target.value as NumberBase;
            setTo(next);
            convert(value, from, next);
          }}
        >
          {BASES.map((base) => (
            <option key={base.id} value={base.id}>
              {base.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Value
        <input
          value={value}
          aria-label="Number to convert"
          onChange={(event) => {
            setValue(event.target.value);
            convert(event.target.value, from, to);
          }}
        />
      </label>
      {error ? <p role="alert">{error}</p> : <p role="status">Result: {result}</p>}
      <p className="tools-back-note">
        <Link to="/tools" className="tools-back-link">
          <ArrowLeft size={13} /> All tools
        </Link>
      </p>
    </main>
  );
}

export default NumberSystemsPage;
