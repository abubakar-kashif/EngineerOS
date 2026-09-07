/**
 * Public marketing navbar: transparent over the hero, blurred once scrolled.
 * Never renders the authenticated app shell — only Login / Get Started.
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
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-[#1F2937]/60 bg-[#05070D]/75 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-6 py-4 sm:px-8"
        aria-label="Main"
      >
        <a
          href="#product"
          onClick={(e) => {
            e.preventDefault();
            goToSection("product");
          }}
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
        >
          <BoltMark size={22} />
          <span className="text-[17px] font-bold tracking-tight text-white">EngineerOS</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                goToSection(link.id);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[#9CA3AF] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LandingButton to="/login" variant="secondary">
            Login
          </LandingButton>
          <LandingButton to="/register" variant="primary">
            Get Started
          </LandingButton>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-[#1F2937] p-2 text-[#E5E7EB] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {menuOpen && (
        <div
          id="landing-mobile-menu"
          className="border-t border-[#1F2937]/60 bg-[#05070D]/95 px-6 py-4 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  goToSection(link.id);
                }}
                className="rounded-lg px-2 py-3 text-sm font-medium text-[#D1D5DB] hover:bg-[#0D1117] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
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
