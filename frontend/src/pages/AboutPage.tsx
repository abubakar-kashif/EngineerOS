import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import SectionHeading from "../components/ui/SectionHeading";

const technologies = [
  "React",
  "TypeScript",
  "Vite",
  "Tailwind CSS",
  "FastAPI",
  "Python",
  "SQLite",
  "SQLAlchemy",
];

const philosophyPoints = [
  {
    title: "Theory before simulation",
    description:
      "Every experiment starts with the underlying concept before students touch a circuit.",
  },
  {
    title: "Learn by doing",
    description:
      "Students build, run, and validate circuits instead of only reading about them.",
  },
  {
    title: "Feedback that explains why",
    description:
      "Quizzes and results are built to reinforce understanding, not just record a score.",
  },
];

function AboutPage() {
  return (
    <div className="placeholder-page about-page">
      <SectionHeading
        eyebrow="About EngineerOS"
        title="An engineering learning environment, not just a website"
        description="EngineerOS connects theory, experimentation, and feedback into one continuous learning loop for electrical engineering students."
      />

      <div className="about-grid">
        <Card className="about-card">
          <h3>The problem</h3>
          <p>
            Electrical engineering theory is usually taught separately from
            hands-on practice. Students memorize formulas without a fast,
            safe way to test them and see the results.
          </p>
        </Card>

        <Card className="about-card">
          <h3>The solution</h3>
          <p>
            EngineerOS gives students a single place to move from theory to
            experiment to validated results, with guidance along the way
            instead of a static textbook.
          </p>
        </Card>
      </div>

      <div className="about-tech-section">
        <h3>Built with</h3>
        <div className="about-tech-list">
          {technologies.map((tech) => (
            <Badge key={tech}>{tech}</Badge>
          ))}
        </div>
      </div>

      <div className="about-philosophy-section">
        <h3>Learning philosophy</h3>
        <div className="about-philosophy-grid">
          {philosophyPoints.map((point) => (
            <Card key={point.title} className="about-philosophy-card">
              <h4>{point.title}</h4>
              <p>{point.description}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="about-team-card">
        <h3>The team</h3>
        <p>
          EngineerOS is built by a five-person student team covering
          frontend, backend, and integration, working toward a shared
          architecture rather than five separate projects.
        </p>
      </Card>
    </div>
  );
}

export default AboutPage;
