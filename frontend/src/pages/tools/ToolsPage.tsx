import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ToolCard from "../../components/tools/ToolCard";
import SectionHeading from "../../components/ui/SectionHeading";
import { TOOLS } from "../../services/tools/toolsService";

/** Tools landing page: one card per engineering tool. */
function ToolsPage() {
  return (
    <main className="page tools-page">
      <SectionHeading
        eyebrow="TOOLBOX"
        title="Engineering Tools"
        description="Quick calculations and references for your lab work — no tab-switching required."
      />

      <div className="tools-cards">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      <p className="tools-back-note">
        <Link to="/dashboard" className="tools-back-link">
          <ArrowLeft size={13} /> Back to dashboard
        </Link>
      </p>
    </main>
  );
}

export default ToolsPage;
