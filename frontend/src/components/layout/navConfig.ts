import {
  FlaskConical,
  Bot,
  ChartNoAxesCombined,
  Wrench,
  FileText,
  Info,
  Settings,
  Sparkles,
  Library,
  House,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export type MenuItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

export type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export const menuGroups: MenuGroup[] = [
  {
    title: "HOME",
    items: [
      { path: "/", label: "Home", icon: House },
      { path: "/dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
    ],
  },
  {
    title: "LEARN",
    items: [
      { path: "/experiments", label: "Experiments", icon: FlaskConical },
      { path: "/quiz", label: "Quiz", icon: ListChecks },
      { path: "/reports", label: "Reports", icon: FileText },
      { path: "/resources", label: "Resources", icon: Library },
    ],
  },
  {
    title: "WORKSPACE",
    items: [
      { path: "/simulation", label: "Simulation", icon: Sparkles },
      { path: "/mentor", label: "AI Mentor", icon: Bot },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { path: "/tools", label: "Engineering Tools", icon: Wrench },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { path: "/settings", label: "Settings", icon: Settings },
      { path: "/about", label: "About", icon: Info },
    ],
  },
];

export function isActiveRoute(itemPath: string, currentPath: string): boolean {
  if (itemPath === "/") return currentPath === "/";
  return currentPath.startsWith(itemPath);
}
