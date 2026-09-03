import { ExternalLink, Link2Off, BookOpen, ClipboardList, FileText, Wrench, Zap } from "lucide-react";
import Badge from "../ui/Badge";
import { RESOURCE_CATEGORY_LABELS, RESOURCE_CATEGORY_VARIANTS } from "../../types/resources";
import type { Resource } from "../../types/resources";

const TYPE_ICONS: Record<string, typeof FileText> = {
  document: FileText,
  reference: ClipboardList,
  tutorial: BookOpen,
  video: BookOpen,
  notes: FileText,
  tool: Wrench,
  calculator: Wrench,
  simulation: Zap,
  datasheet: FileText,
  documentation: BookOpen,
  guide: BookOpen,
};

function TypeIcon({ type }: { type: string }) {
  const Icon = TYPE_ICONS[type.toLowerCase()] ?? BookOpen;
  return <Icon size={17} />;
}

type ResourceCardProps = {
  resource: Resource;
};

/** One library entry: what it is, where it fits, and how to open it. */
function ResourceCard({ resource }: ResourceCardProps) {
  const action = resource.url ? (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="resource-card-action"
    >
      Open Resource <ExternalLink size={13} />
    </a>
  ) : (
    <span className="resource-card-action resource-card-action-disabled">
      No link yet <Link2Off size={13} />
    </span>
  );

  return (
    <article className="resource-card">
      <div className="resource-card-head">
        <span className="resource-card-icon">
          <TypeIcon type={resource.type} />
        </span>
        <Badge variant={RESOURCE_CATEGORY_VARIANTS[resource.category]} size="sm">
          {RESOURCE_CATEGORY_LABELS[resource.category]}
        </Badge>
      </div>

      <h3 className="resource-card-title">{resource.title}</h3>
      <p className="resource-card-description">{resource.description}</p>

      <div className="resource-card-foot">
        <span className="resource-card-type">{resource.type}</span>
        {action}
      </div>
    </article>
  );
}

export default ResourceCard;
