import { Bell, Search } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div className="global-search">
        <Search
          className="search-icon"
          size={18}
          strokeWidth={2}
          aria-hidden="true"
        />

        <input
          type="text"
          placeholder="Search experiments..."
          aria-label="Search experiments"
        />
      </div>

      <div className="navbar-actions">
        <button
          className="icon-btn"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={2} />
        </button>

        <div className="navbar-divider"></div>

        <button
          className="user-profile"
          type="button"
          aria-label="Student profile"
        >
          <span className="user-avatar">S</span>
          <span className="user-name">Student</span>
        </button>
      </div>
    </header>
  );
}

export default Navbar;