import { useEffect, useMemo, useState } from "react";
import { BookMarked, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import ResourceCard from "../../components/resources/ResourceCard";
import ResourceSkeleton from "../../components/resources/ResourceSkeleton";
import SectionHeading from "../../components/ui/SectionHeading";
import { getResources } from "../../services/resources/resourcesService";
import { RESOURCE_CATEGORY_FILTERS } from "../../types/resources";
import type { Resource, ResourceCategory } from "../../types/resources";

function ResourcesPage() {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ResourceCategory | "all">("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const items = await getResources();
        if (!cancelled) setResources(items);
      } catch {
        if (!cancelled) setError("Unable to load resources.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    if (!resources) return [];
    const term = query.trim().toLowerCase();
    return resources.filter((resource) => {
      if (category !== "all" && resource.category !== category) return false;
      if (!term) return true;
      return (
        resource.title.toLowerCase().includes(term) ||
        resource.description.toLowerCase().includes(term) ||
        resource.type.toLowerCase().includes(term)
      );
    });
  }, [resources, query, category]);

  if (error) {
    return (
      <main className="page resources-page">
        <ErrorState
          title="Unable to load resources."
          description="The resource library couldn't be reached. Try again in a moment."
          retryAction={() => setReloadKey((key) => key + 1)}
          retryLabel="Try Again"
        />
      </main>
    );
  }

  if (!resources) {
    return (
      <main className="page resources-page">
        <SectionHeading
          eyebrow="LIBRARY"
          title="Resources"
          description="Curated learning material and references."
        />
        <ResourceSkeleton />
      </main>
    );
  }

  return (
    <main className="page resources-page">
      <SectionHeading
        eyebrow="LIBRARY"
        title="Resources"
        description="Curated tutorials, references, tools and datasheets to support your lab work."
      />

      <div className="resources-controls">
        <div className="formula-search resources-search">
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search resources…"
            aria-label="Search resources"
          />
          {query && (
            <button
              type="button"
              className="formula-search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        <div className="formula-filters" role="group" aria-label="Filter by category">
          {RESOURCE_CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`formula-filter-pill${category === filter.value ? " formula-filter-pill-active" : ""}`}
              aria-pressed={category === filter.value}
              onClick={() => setCategory(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={28} />}
          title="No resources found"
          description={
            query
              ? `Nothing matches "${query}" in this category. Try a different term or clear the filters.`
              : "No resources in this category yet — check back soon."
          }
          action={
            query || category !== "all" ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="resources-grid">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      <p className="resources-count">
        Showing {filtered.length} of {resources.length} resources
      </p>
    </main>
  );
}

export default ResourcesPage;
