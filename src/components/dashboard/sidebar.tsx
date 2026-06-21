"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Key,
  AlertTriangle,
  GitBranch,
  BarChart3,
  Shield,
  Settings,
  Code2,
  ChevronLeft,
  ChevronRight,
  Zap,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type PageId =
  | "overview"
  | "projects"
  | "api-keys"
  | "incidents"
  | "patches"
  | "usage"
  | "rules"
  | "sdk"
  | "test-lab"
  | "settings";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

// UX order: Monitor → Manage → Configure → Learn → Settings
const navItems: NavItem[] = [
  // Group 1: Monitor (most visited, highest priority)
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "incidents", label: "Incidents", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "patches", label: "Patch History", icon: <GitBranch className="h-4 w-4" /> },
  { id: "usage", label: "Usage", icon: <BarChart3 className="h-4 w-4" /> },
  // Group 2: Manage (setup & connect)
  { id: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
  { id: "api-keys", label: "API Keys", icon: <Key className="h-4 w-4" /> },
  // Group 3: Configure
  { id: "rules", label: "Rules", icon: <Shield className="h-4 w-4" /> },
  // Group 4: Learn & Test
  { id: "sdk", label: "SDK", icon: <Code2 className="h-4 w-4" /> },
  { id: "test-lab", label: "Test Lab", icon: <FlaskConical className="h-4 w-4" /> },
  // Group 5: Settings (last)
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

interface DashboardSidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function DashboardSidebar({ activePage, onNavigate }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-200 h-full",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          <Zap className="h-4 w-4" />
        </div>
        {!collapsed && <span className="font-semibold text-lg tracking-tight">Poly</span>}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {/* Group 1: Monitor */}
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Monitor</p>
        {navItems.filter(i => ["overview","incidents","patches","usage"].includes(i.id)).map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={cn("flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors", activePage === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
            {item.icon}{!collapsed && <span>{item.label}</span>}
          </button>
        ))}
        <Separator className="my-2" />
        {/* Group 2: Manage */}
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Manage</p>
        {navItems.filter(i => ["projects","api-keys","rules"].includes(i.id)).map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={cn("flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors", activePage === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
            {item.icon}{!collapsed && <span>{item.label}</span>}
          </button>
        ))}
        <Separator className="my-2" />
        {/* Group 3: Learn */}
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Learn</p>
        {navItems.filter(i => ["sdk","test-lab"].includes(i.id)).map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={cn("flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors", activePage === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
            {item.icon}{!collapsed && <span>{item.label}</span>}
          </button>
        ))}
        <Separator className="my-2" />
        {/* Group 4: Settings */}
        {navItems.filter(i => i.id === "settings").map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={cn("flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors", activePage === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}>
            {item.icon}{!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <Separator />

      {/* Collapse toggle */}
      <div className="p-2 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
