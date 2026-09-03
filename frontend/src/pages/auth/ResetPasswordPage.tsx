import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { resetPassword } from "../../services/authService";
import EngineerOSMark from "../../components/branding/EngineerOSMark";

function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    const errors: Record<string, string> = {};
    if (!password) errors.password = "Password is required.";
    else if (checks.filter((c) => c.met).length < 3) errors.password = "Password does not meet requirements.";
    if (password !== confirmPassword) errors.confirm = "Passwords do not match.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await resetPassword(token || "", password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
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
          <p className="auth-subtitle">Your password has been reset successfully.</p>
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
        <p className="auth-subtitle">Enter your new password below.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
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
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </p>
      </div>
      <p className="auth-dev-notice">Development authentication — not for production use.</p>
    </div>
  );
}

export default ResetPasswordPage;
