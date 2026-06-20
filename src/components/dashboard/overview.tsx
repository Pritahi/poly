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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
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

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const DRIFT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#f43f5e"];

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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-muted-foreground">Failed to load dashboard data</div>;

  const { stats, severityBreakdown, driftTypeBreakdown, recentIncidents, timeSeries } = data;

  const kpiCards = [
    {
      title: "Requests Monitored",
      value: stats.requestsMonitored.toLocaleString(),
      icon: <Eye className="h-4 w-4" />,
      description: "Total API requests tracked",
      color: "text-blue-600",
    },
    {
      title: "Drifts Detected",
      value: stats.driftsDetected.toLocaleString(),
      icon: <AlertTriangle className="h-4 w-4" />,
      description: `${stats.openIncidents} open incidents`,
      color: "text-orange-600",
    },
    {
      title: "Auto-Fixed",
      value: stats.totalAutoFixed.toLocaleString(),
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: `${stats.totalAutoFixed > 0 && stats.driftsDetected > 0 ? Math.round((stats.totalAutoFixed / stats.driftsDetected) * 100) : 0}% fix rate`,
      color: "text-green-600",
    },
    {
      title: "AI Calls",
      value: stats.aiCalls.toLocaleString(),
      icon: <Cpu className="h-4 w-4" />,
      description: "Mapping engine invocations",
      color: "text-purple-600",
    },
    {
      title: "Cache Hits",
      value: stats.cacheHits.toLocaleString(),
      icon: <Database className="h-4 w-4" />,
      description: `${stats.cacheHitRatio}% hit ratio`,
      color: "text-teal-600",
    },
    {
      title: "Cache Misses",
      value: stats.cacheMisses.toLocaleString(),
      icon: <Activity className="h-4 w-4" />,
      description: "Patch cache misses",
      color: "text-red-600",
    },
    {
      title: "Active Projects",
      value: stats.projects.toString(),
      icon: <TrendingUp className="h-4 w-4" />,
      description: `${stats.activeApiKeys} API keys active`,
      color: "text-indigo-600",
    },
    {
      title: "Patch Success",
      value: stats.successfulPatches.toString(),
      icon: <Zap className="h-4 w-4" />,
      description: `${stats.cachedPatches} cached patches`,
      color: "text-amber-600",
    },
  ];

  const severityData = [
    { name: "Critical", value: severityBreakdown.critical, color: SEVERITY_COLORS.critical },
    { name: "High", value: severityBreakdown.high, color: SEVERITY_COLORS.high },
    { name: "Medium", value: severityBreakdown.medium, color: SEVERITY_COLORS.medium },
    { name: "Low", value: severityBreakdown.low, color: SEVERITY_COLORS.low },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Monitor your API schema health at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                <span className={card.color}>{card.icon}</span>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Time Series Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Request & Drift Activity</CardTitle>
            <CardDescription>30-day trend of monitored requests and detected drifts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name="Requests"
                  />
                  <Area
                    type="monotone"
                    dataKey="drifts"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name="Drifts"
                  />
                  <Area
                    type="monotone"
                    dataKey="autoFixed"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name="Auto-fixed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Severity Breakdown</CardTitle>
            <CardDescription>Incidents by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {severityData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Drift Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Drift Types</CardTitle>
            <CardDescription>Breakdown by drift category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driftTypeBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fontSize: 10 }}
                    width={90}
                    tickFormatter={(v: string) => v.replace("_", " ")}
                  />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {driftTypeBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={DRIFT_COLORS[index % DRIFT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Incidents</CardTitle>
            <CardDescription>Latest detected schema drift events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentIncidents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No incidents detected yet</p>
              ) : (
                recentIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge
                        variant="outline"
                        className="shrink-0 text-xs"
                        style={{
                          borderColor: SEVERITY_COLORS[inc.severity as keyof typeof SEVERITY_COLORS],
                          color: SEVERITY_COLORS[inc.severity as keyof typeof SEVERITY_COLORS],
                        }}
                      >
                        {inc.severity}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inc.endpoint}</p>
                        <p className="text-xs text-muted-foreground">
                          {inc.driftType.replace(/_/g, " ")} · {Math.round(inc.confidence)}% confidence
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {inc.autoFixed && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Auto-fixed
                        </Badge>
                      )}
                      <Badge
                        variant={inc.status === "resolved" ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {inc.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
