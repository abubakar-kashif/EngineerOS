import { Link } from "react-router-dom";
import EngineerOSMark from "../branding/EngineerOSMark";

const sections = [
  {
    title: "Learn",
    links: [
      { label: "Experiments", to: "/experiments" },
      { label: "Quiz", to: "/quiz" },
      { label: "Reports", to: "/reports" },
      { label: "Resources", to: "/resources" },
    ],
  },
  {
    title: "Workspace",
    links: [
      { label: "Simulation", to: "/simulation" },
      { label: "AI Mentor", to: "/mentor" },
      { label: "Tools", to: "/tools" },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "About", to: "/about" },
      { label: "Settings", to: "/settings" },
    ],
  },
];

function HomeFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-brand">
          <div className="home-footer-logo">
            <EngineerOSMark />
            <span className="home-footer-name">EngineerOS</span>
          </div>
          <p className="home-footer-tagline">
            AI-powered engineering learning platform.
          </p>
        </div>

        <div className="home-footer-links">
          {sections.map((section) => (
            <div key={section.title} className="home-footer-col">
              <h4 className="home-footer-col-title">{section.title}</h4>
              <ul>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="home-footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="home-footer-bottom">
        <p>&copy; {new Date().getFullYear()} EngineerOS. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default HomeFooter;
