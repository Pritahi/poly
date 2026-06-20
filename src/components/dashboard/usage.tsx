"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Database, Cpu, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  LineChart,
  Line,
} from "recharts";

interface UsageData {
  metrics: Array<{
    date: string;
    requestsMonitored: number;
    driftsDetected: number;
    autoFixed: number;
    aiCalls: number;
    cacheHits: number;
    cacheMisses: number;
  }>;
  totals: {
    requestsMonitored: number;
    driftsDetected: number;
    autoFixed: number;
    aiCalls: number;
    cacheHits: number;
    cacheMisses: number;
  };
  cacheHitRatio: number;
}

export function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage?days=30")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-muted rounded" /><div className="h-64 bg-muted rounded" /></div>;
  if (!data) return <div className="text-muted-foreground">Failed to load usage data</div>;

  const { metrics, totals, cacheHitRatio } = data;
  const chartData = metrics.map((m) => ({
    ...m,
    date: m.date.split("T")[0] || m.date,
  }));

  const summaryCards = [
    { title: "Requests Monitored", value: totals.requestsMonitored.toLocaleString(), icon: <Activity className="h-4 w-4" />, color: "text-blue-600" },
    { title: "Drifts Detected", value: totals.driftsDetected.toLocaleString(), icon: <BarChart3 className="h-4 w-4" />, color: "text-orange-600" },
    { title: "AI Calls", value: totals.aiCalls.toLocaleString(), icon: <Cpu className="h-4 w-4" />, color: "text-purple-600" },
    { title: "Cache Hit Ratio", value: `${cacheHitRatio}%`, icon: <Database className="h-4 w-4" />, color: "text-teal-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Usage</h2>
        <p className="text-muted-foreground">Monitor your Poly usage metrics over time</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
              <span className={card.color}>{card.icon}</span>
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
          </Card>
        ))}
      </div>

      {/* Request & Drift Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requests & Drifts Over Time</CardTitle>
          <CardDescription>Daily trend of monitored requests and detected drifts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                <Area type="monotone" dataKey="requestsMonitored" stroke="#6366f1" fill="#6366f1" fillOpacity={0.08} strokeWidth={2} name="Requests" />
                <Area type="monotone" dataKey="driftsDetected" stroke="#f97316" fill="#f97316" fillOpacity={0.08} strokeWidth={2} name="Drifts" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cache Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cache Performance</CardTitle>
            <CardDescription>Hits vs misses over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(8)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Bar dataKey="cacheHits" stackId="a" fill="#14b8a6" name="Hits" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cacheMisses" stackId="a" fill="#f43f5e" name="Misses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI Calls Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Engine Calls</CardTitle>
            <CardDescription>Daily AI mapping engine invocations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(8)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Line type="monotone" dataKey="aiCalls" stroke="#8b5cf6" strokeWidth={2} dot={false} name="AI Calls" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
