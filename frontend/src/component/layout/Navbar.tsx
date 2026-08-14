function Navbar() {
  return (
    <header className="navbar">
      <div className="global-search">
        <span className="search-icon">⌕</span>

        <input
          type="text"
          placeholder="Search experiments..."
        />


      </div>

      <div className="navbar-actions">
        <button
          className="icon-btn"
          type="button"
          aria-label="Notifications"
        >
          🔔
        </button>

        <div className="navbar-divider"></div>

        <button className="user-profile" type="button">
          <span className="user-avatar">F</span>
          <span className="user-name">Fatima</span>
          
        </button>
      </div>
    </header>
  );
}

export default Navbar;