"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Filter, CheckCircle2, Clock, XCircle, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Incident {
  id: string;
  endpoint: string;
  method: string;
  severity: string;
  driftType: string;
  confidence: number;
  status: string;
  autoFixed: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <AlertTriangle className="h-3 w-3 text-orange-500" />,
  investigating: <Clock className="h-3 w-3 text-blue-500" />,
  resolved: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  dismissed: <XCircle className="h-3 w-3 text-gray-500" />,
};

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (severityFilter !== "all") params.set("severity", severityFilter);

    fetch(`/api/incidents?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setIncidents(d.incidents || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, severityFilter]);

  const filtered = incidents.filter(
    (inc) =>
      inc.endpoint.toLowerCase().includes(search.toLowerCase()) ||
      inc.driftType.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id ? { ...inc, status, resolvedAt: status === "resolved" ? new Date().toISOString() : inc.resolvedAt } : inc
      )
    );
  };

  if (loading) return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
        <p className="text-muted-foreground">Track and manage API schema drift events</p>
      </div>
      <Card>
        <CardContent className="p-0">
          <TableRowSkeleton /><TableRowSkeleton /><TableRowSkeleton /><TableRowSkeleton /><TableRowSkeleton />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
        <p className="text-muted-foreground">Track and manage API schema drift events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints or drift types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="h-3 w-3 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["open", "investigating", "resolved", "dismissed"] as const).map((s) => {
          const count = incidents.filter((i) => i.status === s).length;
          return (
            <Card key={s} className="p-4">
              <div className="flex items-center gap-2">
                {STATUS_ICONS[s]}
                <span className="text-sm font-medium capitalize">{s}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{count}</p>
            </Card>
          );
        })}
      </div>

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Drift Type</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auto Fixed</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={AlertTriangle}
                      title={incidents.length === 0 ? "No incidents yet" : "No incidents match your filters"}
                      description={incidents.length === 0 ? "API drift events will appear here once your SDK starts monitoring." : "Try adjusting your search or filter criteria."}
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(inc.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium font-mono">{inc.endpoint}</p>
                        <p className="text-xs text-muted-foreground">{inc.method}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={SEVERITY_COLORS[inc.severity] || ""}>
                        {inc.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{inc.driftType.replace(/_/g, " ")}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-mono ${inc.confidence > 98 ? "text-green-600" : inc.confidence > 80 ? "text-yellow-600" : "text-red-600"}`}>
                        {Math.round(inc.confidence)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {STATUS_ICONS[inc.status]}
                        <span className="text-sm capitalize">{inc.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {inc.autoFixed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {inc.status === "open" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => updateStatus(inc.id, "investigating")}>
                            Investigate
                          </Button>
                        )}
                        {inc.status !== "resolved" && inc.status !== "dismissed" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-green-600" onClick={() => updateStatus(inc.id, "resolved")}>
                            Resolve
                          </Button>
                        )}
                        {inc.status === "open" && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => updateStatus(inc.id, "dismissed")}>
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
