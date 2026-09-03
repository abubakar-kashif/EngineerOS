import { useState } from "react";
import { Pencil } from "lucide-react";
import Button from "../../components/ui/Button";
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
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  if (!user) {
    return (
      <div className="settings-section">
        <h2 className="settings-section-title">Account</h2>
        <p className="settings-section-description">
          Manage your account details and profile information.
        </p>
        <p className="settings-placeholder">
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

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">Account</h2>
      <p className="settings-section-description">
        Manage your account details and profile information.
      </p>

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
        <div className="settings-field">
          <Button
            variant="secondary"
            size="sm"
            icon={<Pencil size={14} />}
            onClick={startEditing}
          >
            Edit Profile
          </Button>
        </div>
      )}
    </div>
  );
}

export default AccountSettings;
