import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { verifyEmail, resendVerification } from "../../services/authService";
import EngineerOSMark from "../../components/branding/EngineerOSMark";

function VerifyPage() {
  const { refreshUser } = useAuth();
  const location = useLocation();
  const locationState = location.state as { email?: string; dev_code?: string | null } | null;
  const email = locationState?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(locationState?.dev_code ?? null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  function focusInput(index: number) {
    inputsRef.current[index]?.focus();
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    setError("");
    if (value && index < 5) focusInput(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      focusInput(index - 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCode(next);
    focusInput(Math.min(pasted.length, 5));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const fullCode = code.join("");
    if (!email) {
      setError("Email is missing. Start verification again from the login page.");
      return;
    }
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyEmail(email, fullCode);
      setSuccess(true);
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      const response = await resendVerification(email);
      setDevCode(response.dev_code ?? null);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      setError("Failed to resend code. Please try again.");
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fade">
          <div className="auth-brand"><EngineerOSMark size="lg" /><span className="auth-brand-name">EngineerOS</span></div>
          <h1 className="auth-title">Email Verified</h1>
          <p className="auth-subtitle">Your email has been verified successfully.</p>
          <Link to="/dashboard" className="auth-submit auth-submit-link">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade">
        <div className="auth-brand"><EngineerOSMark size="lg" /><span className="auth-brand-name">EngineerOS</span></div>
        <h1 className="auth-title">Verify your email</h1>
        <p className="auth-subtitle">
          We sent a verification code to<br />
          <strong>{email || "your email"}</strong>
        </p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-code-group" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="auth-code-input"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="auth-verify-actions">
          <p className="auth-footer-text">
            Didn't receive it?{" "}
            <button
              type="button"
              className="auth-link auth-link-button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </p>
          <Link to="/login" className="auth-link auth-link-sm">Change email</Link>
        </div>
      </div>

      {devCode && (
        <p className="auth-dev-notice">
          Development mode — no email is actually sent. Your verification code is <strong>{devCode}</strong>.
        </p>
      )}
    </div>
  );
}

export default VerifyPage;
