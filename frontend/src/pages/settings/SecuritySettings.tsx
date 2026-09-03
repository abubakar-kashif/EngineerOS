import { useEffect, useState } from "react";
import { LogOut, Monitor, ShieldCheck } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import Input from "../../components/ui/Input";
import { toast } from "../../components/ui/useToast";
import { useAuth } from "../../contexts/AuthContext";
import { formatRelativeTime } from "../../services/dashboard/dashboardService";
import {
  changePassword,
  getActiveSessions,
  signOutOtherSessions,
} from "../../services/settings/settingsService";
import type { ActiveSession } from "../../types/settings";

/** Password, sessions and account security. */
function SecuritySettings() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const [sessions, setSessions] = useState<ActiveSession[] | null>(null);
  const [sessionsError, setSessionsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    getActiveSessions()
      .then((list) => {
        if (!cancelled) {
          setSessions(list);
          setSessionsError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setSessionsError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError(undefined);
  }

  async function handleChangePassword() {
    if (!currentPassword) {
      setFormError("Enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("New passwords don't match.");
      return;
    }

    setFormError(undefined);
    setSaving(true);
    try {
      const message = await changePassword(currentPassword, newPassword);
      resetForm();
      toast.success("Password updated", message);
      // Other sessions were revoked server-side — refresh the list.
      setReloadKey((key) => key + 1);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOutOthers() {
    setSigningOut(true);
    try {
      const message = await signOutOtherSessions();
      toast.info("Other sessions signed out", message);
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(
        "Couldn't sign out other sessions",
        error instanceof Error ? error.message : "Please try again in a moment.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch {
      toast.error("Sign out failed", "Please try again.");
    }
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Security</h2>
      <p className="settings-section-description">
        Keep your account locked down: rotate your password and review active sessions.
      </p>

      <div className="settings-subsection">
        <h3 className="settings-subsection-title">Change password</h3>
        <div className="settings-edit-form">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="off"
            placeholder="Your current password"
          />
          <Input
            label="New password"
            type="password"
            description="At least 8 characters."
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Your new password"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={formError}
            autoComplete="new-password"
            placeholder="Repeat your new password"
          />
          <div className="settings-form-actions">
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={saving}
              onClick={() => void handleChangePassword()}
            >
              Update Password
            </Button>
            <Button variant="ghost" size="sm" disabled={saving} onClick={resetForm}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="settings-subsection">
        <h3 className="settings-subsection-title">Active sessions</h3>
        {sessionsError ? (
          <ErrorState
            title="Unable to load your sessions."
            description="Your active sessions couldn't be read from the server."
            retryAction={() => setReloadKey((key) => key + 1)}
            retryLabel="Try Again"
          />
        ) : (
          <>
            <ul className="settings-session-list">
              {(sessions ?? []).map((session) => (
                <li key={session.id} className="settings-session-item">
                  <span className="settings-session-icon">
                    <Monitor size={16} />
                  </span>
                  <span className="settings-session-copy">
                    <span className="settings-session-device">
                      {session.device} · {session.browser}
                    </span>
                    <span className="settings-session-time">
                      {session.current
                        ? "Active now on this device"
                        : `Last active ${formatRelativeTime(session.last_active)}`}
                    </span>
                  </span>
                  {session.current ? (
                    <Badge variant="success" size="sm">
                      This device
                    </Badge>
                  ) : (
                    <Badge variant="default" size="sm">
                      Earlier
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
            <p className="settings-note">
              <ShieldCheck size={13} /> Sessions are stored with your account —
              signing out other devices revokes them everywhere at once.
            </p>
            <div className="settings-form-actions">
              <Button
                variant="outline"
                size="sm"
                loading={signingOut}
                disabled={signingOut}
                onClick={() => void handleSignOutOthers()}
              >
                Sign Out Other Sessions
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="settings-subsection">
        <h3 className="settings-subsection-title">Sign out</h3>
        <p className="settings-subsection-description">
          End your EngineerOS session on this device.
        </p>
        <div className="settings-form-actions">
          <Button
            variant="danger"
            size="sm"
            icon={<LogOut size={14} />}
            onClick={() => void handleSignOut()}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SecuritySettings;
