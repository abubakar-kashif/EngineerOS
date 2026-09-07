import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import EngineerOSMark from "../../components/branding/EngineerOSMark";

const PASSWORD_MIN_LENGTH = 8;

function getPasswordChecks(password: string) {
  return [
    { label: `Minimum ${PASSWORD_MIN_LENGTH} characters`, met: password.length >= PASSWORD_MIN_LENGTH },
    { label: "Contains uppercase", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase", met: /[a-z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrength(checks: { met: boolean }[]): { label: string; level: number } {
  const metCount = checks.filter((c) => c.met).length;
  if (metCount <= 1) return { label: "Weak", level: 1 };
  if (metCount <= 2) return { label: "Fair", level: 2 };
  if (metCount <= 4) return { label: "Good", level: 3 };
  return { label: "Strong", level: 4 };
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

  const checks = getPasswordChecks(password);
  const strength = getStrength(checks);

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (checks.filter((c) => c.met).length < 3) errors.password = "Password does not meet minimum requirements.";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await register({ name, email, password });
      navigate("/verify", { state: { email, dev_code: response.dev_code ?? null }, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade">
        <div className="auth-brand">
          <EngineerOSMark size="lg" />
          <span className="auth-brand-name">EngineerOS</span>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">
          Create your EngineerOS account. We&apos;ll email a 6-digit verification code before you can sign in.
        </p>

        {error && (
          <div className="auth-error" role="alert">{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="reg-name" className="auth-label">Name</label>
            <input
              id="reg-name" type="text"
              className={`auth-input${fieldErrors.name ? " auth-input-error" : ""}`}
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
              placeholder="Your full name"
              autoComplete="name"
              disabled={loading}
            />
            {fieldErrors.name && <p className="auth-field-error">{fieldErrors.name}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">Email</label>
            <input
              id="reg-email" type="email"
              className={`auth-input${fieldErrors.email ? " auth-input-error" : ""}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: "" })); }}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
            {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password" className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                className={`auth-input${fieldErrors.password ? " auth-input-error" : ""}`}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                onFocus={() => setShowRequirements(true)}
                onBlur={() => setShowRequirements(false)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                disabled={loading}
              />
              <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}

            {/* Strength indicator */}
            {password && (
              <div className="auth-strength">
                <div className="auth-strength-bar">
                  {[1, 2, 3, 4].map((l) => (
                    <div key={l} className={`auth-strength-segment${strength.level >= l ? ` auth-strength-level-${strength.level}` : ""}`} />
                  ))}
                </div>
                <span className={`auth-strength-label auth-strength-label-${strength.level}`}>{strength.label}</span>
              </div>
            )}

            {/* Password requirements */}
            {(showRequirements || password) && (
              <ul className="auth-requirements">
                {checks.map((check) => (
                  <li key={check.label} className={`auth-req${check.met ? " auth-req-met" : ""}`}>
                    {check.met ? <Check size={14} /> : <X size={14} />}
                    {check.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm" className="auth-label">Confirm Password</label>
            <div className="auth-input-wrapper">
              <input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                className={`auth-input${fieldErrors.confirmPassword ? " auth-input-error" : ""}`}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                placeholder="Confirm your password"
                autoComplete="new-password"
                disabled={loading}
              />
              <button type="button" className="auth-input-toggle" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} aria-label={showConfirm ? "Hide password" : "Show password"}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="auth-field-error">{fieldErrors.confirmPassword}</p>}
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
