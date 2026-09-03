import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../services/authService";
import EngineerOSMark from "../../components/branding/EngineerOSMark";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldError("");

    if (!email.trim()) { setFieldError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("Enter a valid email address."); return; }

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      setDevCode(response.dev_code ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fade">
          <div className="auth-brand"><EngineerOSMark size="lg" /><span className="auth-brand-name">EngineerOS</span></div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
          </p>
          <Link to="/login" className="auth-submit auth-submit-link">Back to Sign In</Link>
        </div>
        {devCode && (
          <p className="auth-dev-notice">
            Development mode — no email is actually sent. Your reset code is <strong>{devCode}</strong>.{" "}
            <Link to={`/reset-password/${devCode}`} className="auth-link">Reset now</Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade">
        <div className="auth-brand"><EngineerOSMark size="lg" /><span className="auth-brand-name">EngineerOS</span></div>
        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="forgot-email" className="auth-label">Email</label>
            <input
              id="forgot-email" type="email"
              className={`auth-input${fieldError ? " auth-input-error" : ""}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
            {fieldError && <p className="auth-field-error">{fieldError}</p>}
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <p className="auth-footer-text">
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </p>
      </div>
      <p className="auth-dev-notice">Development authentication — not for production use.</p>
    </div>
  );
}

export default ForgotPasswordPage;
