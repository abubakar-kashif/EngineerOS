/**
 * Marketing footer. Doubles as the "About" anchor target for the navbar.
 * Links without a live destination render as muted text rather than dead links.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Mail, MessageCircle, Send } from "lucide-react";
import { BoltMark } from "./illustrations";

type FooterLink = { label: string; to?: string };

const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Product",
    links: [
      { label: "Experiments", to: "/experiments" },
      { label: "Simulation", to: "/simulation" },
      { label: "AI Mentor", to: "/mentor" },
      { label: "Quizzes", to: "/quiz" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact" },
      { label: "Privacy Policy" },
      { label: "Terms of Use" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation" },
      { label: "Help Center" },
      { label: "Guides" },
      { label: "Community" },
    ],
  },
];

const SOCIALS = [
  { icon: Globe, label: "Website" },
  { icon: Mail, label: "Email" },
  { icon: MessageCircle, label: "Community chat" },
];

function LandingFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer id="about" className="scroll-mt-24 border-t border-[#1F2937]/50 bg-[#070A12]">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-2">
              <BoltMark size={20} />
              <span className="text-base font-bold tracking-tight text-white">EngineerOS</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#9CA3AF]">
              The complete electrical engineering learning platform.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E5E7EB]">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="rounded text-sm text-[#9CA3AF] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-[#6B7280]" title="Coming soon">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E5E7EB]">
              Stay Connected
            </h3>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                setSubscribed(true);
                setEmail("");
              }}
            >
              <label htmlFor="landing-newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="landing-newsletter"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="min-w-0 flex-1 rounded-xl border border-[#1F2937] bg-[#0D1117] px-3.5 py-2.5 text-sm text-white placeholder:text-[#6B7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-3.5 text-white transition-colors hover:bg-[#3B82F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
            <p
              className="mt-2 min-h-[18px] text-xs text-[#60A5FA]"
              role="status"
              aria-live="polite"
            >
              {subscribed ? "Thanks — you're on the list." : ""}
            </p>

            <ul className="mt-5 flex gap-3">
              {SOCIALS.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#1F2937] bg-[#0D1117] text-[#9CA3AF]"
                    title={`${label} — coming soon`}
                    aria-label={`${label} — coming soon`}
                    role="img"
                  >
                    <Icon size={16} aria-hidden="true" />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-[#1F2937]/50 pt-6 text-xs text-[#6B7280]">
          © 2026 EngineerOS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default LandingFooter;
