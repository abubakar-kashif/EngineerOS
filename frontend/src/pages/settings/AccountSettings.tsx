import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, UserPlus } from "lucide-react";
import Button from "../../components/ui/Button";
import Dialog from "../../components/ui/Dialog";
import Input from "../../components/ui/Input";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../components/ui/useToast";
import { updateAccountProfile } from "../../services/settings/settingsService";
import type { User } from "../../types/auth";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMemberSince(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Profile card with inline editing for name and avatar. */
function AccountSettings() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  if (!user) {
    return (
      <div className="settings-section">
        <div className="settings-section-head">
          <div>
            <h2 className="settings-section-title">Account</h2>
            <p className="settings-section-description">
              Manage your account details and profile information.
            </p>
          </div>
        </div>
        <p className="settings-empty">
          Your profile will appear here once you sign in.
        </p>
      </div>
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }
    setNameError(undefined);
    setSaving(true);
    try {
      const updated: User = await updateAccountProfile({
        name,
        avatar_url: avatarUrl.trim() || null,
      });
      await refreshUser();
      setEditing(false);
      toast.success("Profile updated", `Saved as ${updated.name}.`);
    } catch (error) {
      toast.error(
        "Couldn't update profile",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const startEditing = () => {
    setName(user.name);
    setAvatarUrl(user.avatar_url ?? "");
    setNameError(undefined);
    setEditing(true);
  };

  async function handleAddAccount() {
    setSwitching(true);
    try {
      await logout();
      navigate("/register", { replace: true });
    } catch {
      toast.error("Couldn't switch accounts", "Please try again.");
      setSwitching(false);
      setAddAccountOpen(false);
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-section-head">
        <div>
          <h2 className="settings-section-title">Account</h2>
          <p className="settings-section-description">
            Manage your account details and profile information.
          </p>
        </div>
        <button
          type="button"
          className="settings-add-account"
          onClick={() => setAddAccountOpen(true)}
          aria-label="Add account"
          title="Add account"
        >
          <Plus size={18} strokeWidth={2.25} />
        </button>
      </div>

      <div className="settings-profile">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="settings-profile-avatar"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span className="settings-profile-avatar settings-profile-avatar-fallback" aria-hidden="true">
            {initials(user.name) || "E"}
          </span>
        )}

        <div className="settings-profile-details">
          <span className="settings-profile-name">{user.name}</span>
          <span className="settings-profile-email">{user.email}</span>
          {formatMemberSince(user.created_at) && (
            <span className="settings-profile-since">
              Member since {formatMemberSince(user.created_at)}
            </span>
          )}
        </div>
      </div>

      {editing ? (
        <div className="settings-edit-form">
          <Input
            label="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={nameError}
            autoComplete="name"
          />
          <Input
            label="Avatar URL"
            description="Optional link to a profile image."
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://…"
            type="url"
            autoComplete="url"
          />
          <div className="settings-form-actions">
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              Save Changes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="settings-field settings-account-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={<Pencil size={14} />}
            onClick={startEditing}
          >
            Edit Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<UserPlus size={14} />}
            onClick={() => setAddAccountOpen(true)}
          >
            Add account
          </Button>
        </div>
      )}

      <Dialog
        open={addAccountOpen}
        onClose={() => {
          if (!switching) setAddAccountOpen(false);
        }}
        onConfirm={() => void handleAddAccount()}
        title="Add another account?"
        description="You'll be signed out of the current account, then you can register or sign in with a different one."
        confirmLabel={switching ? "Switching…" : "Continue"}
        cancelLabel="Cancel"
        variant="default"
      />
    </div>
  );
}

export default AccountSettings;
