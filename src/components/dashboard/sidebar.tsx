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
  | "settings";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
  { id: "api-keys", label: "API Keys", icon: <Key className="h-4 w-4" /> },
  { id: "incidents", label: "Incidents", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "patches", label: "Patch History", icon: <GitBranch className="h-4 w-4" /> },
  { id: "usage", label: "Usage", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "rules", label: "Rules", icon: <Shield className="h-4 w-4" /> },
  { id: "sdk", label: "SDK", icon: <Code2 className="h-4 w-4" /> },
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
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activePage === item.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
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
