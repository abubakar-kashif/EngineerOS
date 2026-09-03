import type { WorkspaceTab } from "../../types/simulation";

interface WorkspaceTabsProps {
  activeTab: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
}

const tabs: { id: WorkspaceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "circuit-setup", label: "Circuit Setup" },
  { id: "simulation", label: "Simulation" },
  { id: "results", label: "Results" },
];

function WorkspaceTabs({ activeTab, onChange }: WorkspaceTabsProps) {
  return (
    <nav className="ws-tabs" role="tablist" aria-label="Workspace sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`ws-tab ${activeTab === tab.id ? "ws-tab--active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export default WorkspaceTabs;
