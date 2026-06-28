"use client";

import { useState } from "react";
import { useAuth } from "@/components/supabase-auth-provider";
import { DashboardSidebar, PageId } from "@/components/dashboard/sidebar";
import { LandingPage } from "@/components/dashboard/landing";
import { OverviewPage } from "@/components/dashboard/overview";
import { ProjectsPage } from "@/components/dashboard/projects";
import { ApiKeysPage } from "@/components/dashboard/api-keys";
import { IncidentsPage } from "@/components/dashboard/incidents";
import { PatchHistoryPage } from "@/components/dashboard/patch-history";
import { UsagePage } from "@/components/dashboard/usage";
import { RulesPage } from "@/components/dashboard/rules";
import { SdkDocsPage } from "@/components/dashboard/sdk-docs";
import { TestLabPage } from "@/components/dashboard/test-lab";
import { SettingsPage } from "@/components/dashboard/settings";

const pageComponents: Record<PageId, React.ComponentType> = {
  overview: OverviewPage,
  projects: ProjectsPage,
  "api-keys": ApiKeysPage,
  incidents: IncidentsPage,
  patches: PatchHistoryPage,
  usage: UsagePage,
  rules: RulesPage,
  sdk: SdkDocsPage,
  "test-lab": TestLabPage,
  settings: SettingsPage,
};

export default function Dashboard() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);
  const [activePage, setActivePage] = useState<PageId>("overview");

  // Show landing page if not in dashboard mode
  if (!showDashboard) {
    return <LandingPage onEnterDashboard={() => {
      if (!user) {
        signInWithGoogle();
      } else {
        setShowDashboard(true);
      }
    }} />;
  }

  // Loading state while checking session
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse h-8 w-8 rounded-full bg-teal-500" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    signInWithGoogle();
    return null;
  }

  const PageComponent = pageComponents[activePage];

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}
