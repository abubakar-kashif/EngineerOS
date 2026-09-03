import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, User, Moon, Sun, Monitor } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../ui/ThemeContext";

function ProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/login");
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const themeIcon = theme === "dark" ? <Moon size={14} /> : theme === "light" ? <Sun size={14} /> : <Monitor size={14} />;

  return (
    <div className="profile-menu" ref={ref}>
      <button
        className="profile-menu-trigger"
        onClick={() => setOpen(!open)}
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <span className="profile-menu-avatar">{initials}</span>
        <span className="profile-menu-name">{user.name}</span>
      </button>

      {open && (
        <div className="profile-menu-dropdown animate-slide-down">
          <div className="profile-menu-header">
            <p className="profile-menu-user-name">{user.name}</p>
            <p className="profile-menu-user-email">{user.email}</p>
          </div>

          <div className="profile-menu-divider" />

          <Link to="/settings" className="profile-menu-item" onClick={() => setOpen(false)}>
            <User size={16} /> Profile
          </Link>
          <Link to="/settings" className="profile-menu-item" onClick={() => setOpen(false)}>
            <Settings size={16} /> Settings
          </Link>

          <div className="profile-menu-divider" />

          <div className="profile-menu-theme">
            <span className="profile-menu-theme-label">
              {themeIcon} Theme
            </span>
            <div className="profile-menu-theme-options">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  className={`profile-menu-theme-btn${theme === t ? " profile-menu-theme-btn-active" : ""}`}
                  onClick={() => { setTheme(t); }}
                  aria-label={`${t} theme`}
                >
                  {t === "light" ? <Sun size={14} /> : t === "dark" ? <Moon size={14} /> : <Monitor size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div className="profile-menu-divider" />

          <button className="profile-menu-item profile-menu-logout" onClick={handleLogout}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
