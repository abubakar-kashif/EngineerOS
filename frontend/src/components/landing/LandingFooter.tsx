/**
 * Marketing footer. Doubles as the "About" anchor target for the navbar.
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
    <footer id="about" className="landing-footer">
      <div className="landing-container landing-footer-inner">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand">
            <div className="landing-brand">
              <BoltMark size={24} />
              <span className="landing-brand-name">EngineerOS</span>
            </div>
            <p>The complete electrical engineering learning platform.</p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title} className="landing-footer-col">
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to}>{link.label}</Link>
                    ) : (
                      <span title="Coming soon">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="landing-footer-col">
            <h3>Stay Connected</h3>
            <form
              className="landing-footer-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                setSubscribed(true);
                setEmail("");
              }}
            >
              <label htmlFor="landing-newsletter" className="landing-sr-only">
                Email address
              </label>
              <input
                id="landing-newsletter"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <button type="submit" aria-label="Subscribe">
                <Send size={16} aria-hidden="true" />
              </button>
            </form>
            <p
              style={{ minHeight: 18, marginTop: 10, fontSize: 12, color: "#60A5FA" }}
              role="status"
              aria-live="polite"
            >
              {subscribed ? "Thanks — you're on the list." : ""}
            </p>

            <ul className="landing-footer-social">
              {SOCIALS.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <span
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

        <p className="landing-footer-copy">© 2026 EngineerOS. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default LandingFooter;
