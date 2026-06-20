"use client";

import { useState } from "react";
import { DashboardSidebar, PageId } from "@/components/dashboard/sidebar";
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
  const [activePage, setActivePage] = useState<PageId>("overview");
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
