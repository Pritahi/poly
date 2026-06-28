"use client";

import { useState } from "react";
import { useAuth } from "@/components/supabase-auth-provider";
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

const navGroups = [
  {
    label: "Monitor",
    items: [
      { id: "overview" as PageId, label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "incidents" as PageId, label: "Incidents", icon: <AlertTriangle className="h-4 w-4" /> },
      { id: "patches" as PageId, label: "Patch History", icon: <GitBranch className="h-4 w-4" /> },
      { id: "usage" as PageId, label: "Usage", icon: <BarChart3 className="h-4 w-4" /> },
    ],
  },
  {
    label: "Manage",
    items: [
      { id: "projects" as PageId, label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
      { id: "api-keys" as PageId, label: "API Keys", icon: <Key className="h-4 w-4" /> },
      { id: "rules" as PageId, label: "Rules", icon: <Shield className="h-4 w-4" /> },
    ],
  },
  {
    label: "Learn",
    items: [
      { id: "sdk" as PageId, label: "SDK", icon: <Code2 className="h-4 w-4" /> },
      { id: "test-lab" as PageId, label: "Test Lab", icon: <FlaskConical className="h-4 w-4" /> },
    ],
  },
  {
    label: "",
    items: [
      { id: "settings" as PageId, label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
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
        "flex flex-col border-r border-border bg-white transition-all duration-200 h-full",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <div className="flex items-center justify-center h-7 w-7 bg-primary text-primary-foreground font-bold text-xs">
          <Zap className="h-3.5 w-3.5" />
        </div>
        {!collapsed && <span className="font-bold text-lg tracking-tight ">Poly</span>}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            {group.label && !collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium transition-colors",
                    "border border-transparent",
                    activePage === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover: hover:border-border"
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Sign out */}
      <div className="p-3 border-t border-border">
        <SidebarUser collapsed={collapsed} />
      </div>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center gap-2 w-full py-1.5 text-xs text-muted-foreground hover:text-gray-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  );
}

function SidebarUser({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      {user.user_metadata?.avatar_url && (
        <img src={user.user_metadata.avatar_url} alt="" className="h-7 w-7 rounded-full shrink-0" />
      )}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">{user.user_metadata?.full_name || user.email}</p>
          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
        </div>
      )}
      <button
        onClick={() => signOut().then(() => window.location.reload())}
        className="text-[10px] text-muted-foreground hover:text-rose-600 transition-colors shrink-0"
        title="Sign out"
      >
        {collapsed ? "←" : "Sign out"}
      </button>
    </div>
  );
}
