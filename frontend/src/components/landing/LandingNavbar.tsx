/**
 * Public marketing navbar: transparent over the hero, blurred once scrolled.
 */
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import LandingButton from "./LandingButton";
import { BoltMark } from "./illustrations";

const LINKS = [
  { label: "Product", id: "product" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "About", id: "about" },
] as const;

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    setMenuOpen(false);
  };

  return (
    <header className={`landing-nav${scrolled ? " landing-nav--scrolled" : ""}`}>
      <nav className="landing-container landing-nav-inner" aria-label="Main">
        <a
          href="#product"
          className="landing-brand"
          onClick={(e) => {
            e.preventDefault();
            goToSection("product");
          }}
        >
          <BoltMark size={26} />
          <span className="landing-brand-name">EngineerOS</span>
        </a>

        <div className="landing-nav-links">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                goToSection(link.id);
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="landing-nav-actions">
          <LandingButton to="/login" variant="ghost">
            Login
          </LandingButton>
          <LandingButton to="/register" variant="primary">
            Get Started
          </LandingButton>
        </div>

        <button
          type="button"
          className="landing-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div id="landing-mobile-menu" className="landing-nav-mobile">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                goToSection(link.id);
              }}
            >
              {link.label}
            </a>
          ))}
          <div className="landing-nav-mobile-actions">
            <LandingButton to="/login" variant="secondary" block>
              Login
            </LandingButton>
            <LandingButton to="/register" variant="primary" block>
              Get Started
            </LandingButton>
          </div>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
