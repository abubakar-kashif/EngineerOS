import { useState } from "react";
import { Menu } from "lucide-react";
import NotificationCenter from "./NotificationCenter";
import ProfileMenu from "./ProfileMenu";
import MobileNav from "./MobileNav";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="navbar">
        <button
          className="icon-btn mobile-menu-btn"
          type="button"
          aria-label="Open navigation"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        <div className="navbar-actions">
          <NotificationCenter />
          <div className="navbar-divider"></div>
          <ProfileMenu />
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

export default Navbar;
