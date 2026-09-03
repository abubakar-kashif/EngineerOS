/** Client-side grouping used to organize the resources page. */
export type ResourceCategory =
  | "learning"
  | "reference"
  | "tools"
  | "datasheets"
  | "simulation"
  | "documentation";

/** Shape returned by GET /api/resources. */
export interface ApiResource {
  id: string;
  title: string;
  type: string;
  description: string;
  url: string | null;
}

export type ResourceSource = "api" | "seed";

/** Resource enriched with a client-side category. */
export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  /** Backend type label, e.g. "document" or "reference". */
  type: string;
  url: string | null;
  source: ResourceSource;
}

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  learning: "Learning",
  reference: "Reference",
  tools: "Engineering Tools",
  datasheets: "Datasheets",
  simulation: "Simulation",
  documentation: "Documentation",
};

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "learning",
  "reference",
  "tools",
  "datasheets",
  "simulation",
  "documentation",
];

export const RESOURCE_CATEGORY_FILTERS: {
  value: ResourceCategory | "all";
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "learning", label: "Learning" },
  { value: "reference", label: "Reference" },
  { value: "tools", label: "Engineering Tools" },
  { value: "datasheets", label: "Datasheets" },
  { value: "simulation", label: "Simulation" },
  { value: "documentation", label: "Documentation" },
];

/** Badge variant used to render each category consistently. */
export const RESOURCE_CATEGORY_VARIANTS: Record<
  ResourceCategory,
  "primary" | "success" | "warning" | "info" | "default" | "accent"
> = {
  learning: "primary",
  reference: "info",
  tools: "accent",
  datasheets: "warning",
  simulation: "success",
  documentation: "default",
};

/**
 * Maps a backend resource type label to a client-side category.
 * The backend currently only seeds "document" and "reference".
 */
export const RESOURCE_TYPE_TO_CATEGORY: Record<string, ResourceCategory> = {
  document: "learning",
  reference: "reference",
  notes: "learning",
  tutorial: "learning",
  video: "learning",
  tool: "tools",
  calculator: "tools",
  datasheet: "datasheets",
  simulation: "simulation",
  documentation: "documentation",
  docs: "documentation",
  guide: "documentation",
};
