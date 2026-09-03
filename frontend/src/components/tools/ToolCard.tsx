import { Link } from "react-router-dom";
import { ArrowLeftRight, ArrowRight, Calculator, Sigma } from "lucide-react";
import type { ToolEntry } from "../../types/tools";

const TOOL_ICONS: Record<ToolEntry["icon"], typeof Calculator> = {
  calculator: Calculator,
  converter: ArrowLeftRight,
  formula: Sigma,
};

type ToolCardProps = {
  tool: ToolEntry;
};

/** Landing card for one engineering tool on the /tools page. */
function ToolCard({ tool }: ToolCardProps) {
  const Icon = TOOL_ICONS[tool.icon];

  return (
    <Link to={tool.path} className="tools-card">
      <span className="tools-card-icon">
        <Icon size={20} />
      </span>
      <h3 className="tools-card-title">{tool.title}</h3>
      <p className="tools-card-description">{tool.description}</p>
      <span className="tools-card-cta">
        Open tool <ArrowRight size={14} />
      </span>
    </Link>
  );
}

export default ToolCard;
