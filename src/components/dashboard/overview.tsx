"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatCardSkeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardData {
  stats: {
    projects: number;
    totalIncidents: number;
    autoFixed: number;
    openIncidents: number;
    successfulPatches: number;
    cachedPatches: number;
    activeApiKeys: number;
    rules: number;
    requestsMonitored: number;
    driftsDetected: number;
    totalAutoFixed: number;
    aiCalls: number;
    cacheHits: number;
    cacheMisses: number;
    cacheHitRatio: number;
  };
  severityBreakdown: { critical: number; high: number; medium: number; low: number };
  driftTypeBreakdown: { type: string; count: number }[];
  recentIncidents: Array<{
    id: string;
    endpoint: string;
    severity: string;
    driftType: string;
    confidence: number;
    status: string;
    autoFixed: boolean;
    createdAt: string;
  }>;
  timeSeries: Array<{
    date: string;
    requests: number;
    drifts: number;
    autoFixed: number;
    aiCalls: number;
    cacheHits: number;
    cacheMisses: number;
  }>;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground text-sm">Failed to load dashboard data</p>;

  const { stats, severityBreakdown, driftTypeBreakdown, recentIncidents, timeSeries } = data;

  const kpiCards = [
    { title: "Requests Monitored", value: stats.requestsMonitored.toLocaleString(), icon: <Eye className="h-3.5 w-3.5" />, desc: "Total tracked", color: "" },
    { title: "Drifts Detected", value: stats.driftsDetected.toLocaleString(), icon: <AlertTriangle className="h-3.5 w-3.5" />, desc: `${stats.openIncidents} open`, color: "text-orange-600" },
    { title: "Auto-Fixed", value: stats.totalAutoFixed.toLocaleString(), icon: <CheckCircle2 className="h-3.5 w-3.5" />, desc: `${stats.totalAutoFixed > 0 && stats.driftsDetected > 0 ? Math.round((stats.totalAutoFixed / stats.driftsDetected) * 100) : 0}% fix rate`, color: "text-emerald-600" },
    { title: "AI Calls", value: stats.aiCalls.toLocaleString(), icon: <Cpu className="h-3.5 w-3.5" />, desc: "Mapping invocations", color: "text-violet-600" },
    { title: "Cache Hits", value: stats.cacheHits.toLocaleString(), icon: <Database className="h-3.5 w-3.5" />, desc: `${stats.cacheHitRatio}% ratio`, color: "" },
    { title: "Projects", value: stats.projects.toString(), icon: <TrendingUp className="h-3.5 w-3.5" />, desc: `${stats.activeApiKeys} keys active`, color: "" },
    { title: "Patches", value: stats.successfulPatches.toString(), icon: <Zap className="h-3.5 w-3.5" />, desc: `${stats.cachedPatches} cached`, color: "text-amber-600" },
    { title: "Open Incidents", value: stats.openIncidents.toString(), icon: <Activity className="h-3.5 w-3.5" />, desc: `${stats.totalIncidents} total`, color: "" },
  ];

  const severityData = [
    { name: "Critical", value: severityBreakdown.critical, color: SEVERITY_COLORS.critical },
    { name: "High", value: severityBreakdown.high, color: SEVERITY_COLORS.high },
    { name: "Medium", value: severityBreakdown.medium, color: SEVERITY_COLORS.medium },
    { name: "Low", value: severityBreakdown.low, color: SEVERITY_COLORS.low },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight ">Overview</h2>
        <p className="text-muted-foreground text-sm mt-0.5">API schema health at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div key={card.title} className="border border-border bg-white p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{card.title}</span>
              <span className={card.color}>{card.icon}</span>
            </div>
            <div className="text-2xl font-bold  tabular-nums mt-1">{card.value}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 border border-border bg-white p-5">
          <h3 className="text-sm font-bold  mb-4">Request & Drift Activity</h3>
          <p className="text-[11px] text-muted-foreground -mt-3 mb-4">30-day trend</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} stroke="#d4d4d4" />
                <YAxis tick={{ fontSize: 10 }} stroke="#d4d4d4" />
                <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid #e5e5e5", boxShadow: "none", fontSize: 12 }} />
                <Area type="monotone" dataKey="requests" stroke="var(--foreground)" fill="var(--foreground)" fillOpacity={0.05} strokeWidth={1.5} name="Requests" />
                <Area type="monotone" dataKey="drifts" stroke="#f97316" fill="#f97316" fillOpacity={0.05} strokeWidth={1.5} name="Drifts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border bg-white p-5">
          <h3 className="text-sm font-bold  mb-4">Severity</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                  {severityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {severityData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                <div className="h-2 w-2" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="border border-border bg-white p-5">
        <h3 className="text-sm font-bold  mb-1">Recent Incidents</h3>
        <p className="text-[11px] text-muted-foreground mb-4">Latest schema drift events</p>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {recentIncidents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No incidents detected yet</p>
          ) : (
            recentIncidents.map((inc) => (
              <div key={inc.id} className="flex items-center justify-between p-3 border border-border hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className="text-[10px] rounded-none border-border" style={{ color: SEVERITY_COLORS[inc.severity] || "var(--foreground)" }}>
                    {inc.severity}
                  </Badge>
                  <div className="min-w-0">
                    <p className="text-xs font-medium  truncate">{inc.endpoint}</p>
                    <p className="text-[10px] text-muted-foreground">{inc.driftType.replace(/_/g, " ")} · {Math.round(inc.confidence)}% confidence</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {inc.autoFixed && <Badge className="text-[10px] rounded-none bg-emerald-100 text-emerald-700 border-0">Auto-fixed</Badge>}
                  <Badge variant="secondary" className="text-[10px] rounded-none">{inc.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
