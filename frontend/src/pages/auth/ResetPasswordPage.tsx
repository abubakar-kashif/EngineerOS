import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { ApiError } from "../../services/api";
import { resetPassword } from "../../services/authService";
import EngineerOSMark from "../../components/branding/EngineerOSMark";

function ResetPasswordPage() {
  const { token: tokenParam } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState(tokenParam && /^\d{6}$/.test(tokenParam) ? tokenParam : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expired, setExpired] = useState(false);

  const checks = [
    { label: "Minimum 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase", met: /[a-z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setExpired(false);
    const errors: Record<string, string> = {};
    if (!/^\d{6}$/.test(code.trim())) {
      errors.code = "Enter the 6-digit reset code from your email.";
    }
    if (!password) errors.password = "Password is required.";
    else if (checks.filter((c) => c.met).length < 3) errors.password = "Password does not meet requirements.";
    if (password !== confirmPassword) errors.confirm = "Passwords do not match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await resetPassword(code.trim(), password);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password.";
      const isExpired =
        /invalid or expired/i.test(message) ||
        (err instanceof ApiError && err.status === 400);
      setExpired(isExpired);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-fade">
          <div className="auth-brand"><EngineerOSMark size="lg" /><span className="auth-brand-name">EngineerOS</span></div>
          <h1 className="auth-title">Password Reset</h1>
          <p className="auth-subtitle">Your password has been reset successfully. Sign in with your new password.</p>
          <Link to="/login" className="auth-submit auth-submit-link">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade">
        <div className="auth-brand"><EngineerOSMark size="lg" /><span className="auth-brand-name">EngineerOS</span></div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          Enter the reset code from your email and choose a new password.
          The code alone in the URL does not reset your password — it must be validated by the server.
        </p>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {expired && (
          <p className="auth-footer-text" style={{ marginTop: 8 }}>
            Code expired or already used?{" "}
            <Link to="/forgot-password" className="auth-link">Request a new reset code</Link>
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="reset-code" className="auth-label">Reset code</label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              className={`auth-input${fieldErrors.code ? " auth-input-error" : ""}`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setFieldErrors((p) => ({ ...p, code: "" }));
                setExpired(false);
              }}
              placeholder="6-digit code"
              autoComplete="one-time-code"
              disabled={loading}
              maxLength={6}
            />
            {fieldErrors.code && <p className="auth-field-error">{fieldErrors.code}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="reset-password" className="auth-label">New Password</label>
            <div className="auth-input-wrapper">
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                className={`auth-input${fieldErrors.password ? " auth-input-error" : ""}`}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                placeholder="Create a new password"
                autoComplete="new-password"
                disabled={loading}
              />
              <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
            {password && (
              <ul className="auth-requirements">
                {checks.map((c) => (
                  <li key={c.label} className={`auth-req${c.met ? " auth-req-met" : ""}`}>
                    {c.met ? <Check size={14} /> : <X size={14} />}
                    {c.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="reset-confirm" className="auth-label">Confirm Password</label>
            <input
              id="reset-confirm" type="password"
              className={`auth-input${fieldErrors.confirm ? " auth-input-error" : ""}`}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirm: "" })); }}
              placeholder="Confirm new password"
              autoComplete="new-password"
              disabled={loading}
            />
            {fieldErrors.confirm && <p className="auth-field-error">{fieldErrors.confirm}</p>}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <p className="auth-footer-text">
          <button type="button" className="auth-link auth-link-button" onClick={() => navigate("/forgot-password")}>
            Request a new code
          </button>
          {" · "}
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </p>
      </div>
      <p className="auth-dev-notice">Development authentication — not for production use.</p>
    </div>
  );
}

export default ResetPasswordPage;
