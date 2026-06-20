"use client";

import { useEffect, useState } from "react";
import { GitBranch, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Patch {
  id: string;
  endpoint: string;
  patchType: string;
  fromPath: string;
  toPath: string;
  confidence: number;
  success: boolean;
  appliedAt: string;
  rolledBack: boolean;
}

const PATCH_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  rename: { label: "Rename", color: "bg-blue-100 text-blue-800" },
  remove: { label: "Remove", color: "bg-red-100 text-red-800" },
  add_default: { label: "Add Default", color: "bg-green-100 text-green-800" },
  type_conversion: { label: "Type Conv.", color: "bg-purple-100 text-purple-800" },
};

export function PatchHistoryPage() {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/patches")
      .then((r) => r.json())
      .then((d) => setPatches(d.patches || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rollbackPatch = async (id: string) => {
    await fetch("/api/patches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "rollback" }),
    });
    setPatches((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rolledBack: true } : p))
    );
    toast({ title: "Patch rolled back", description: "The patch has been reverted" });
  };

  if (loading) return <div className="animate-pulse h-96 bg-muted rounded" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Patch History</h2>
        <p className="text-muted-foreground">Review all AI-generated patch operations and their outcomes</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Successful</span>
          </div>
          <p className="text-2xl font-bold mt-1">{patches.filter((p) => p.success).length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-muted-foreground">Failed</span>
          </div>
          <p className="text-2xl font-bold mt-1">{patches.filter((p) => !p.success).length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">Rolled Back</span>
          </div>
          <p className="text-2xl font-bold mt-1">{patches.filter((p) => p.rolledBack).length}</p>
        </Card>
      </div>

      {/* Patches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Patches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Old Field</TableHead>
                <TableHead>New Field</TableHead>
                <TableHead>Patch Type</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No patches recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                patches.map((p) => {
                  const style = PATCH_TYPE_STYLES[p.patchType] || { label: p.patchType, color: "bg-gray-100 text-gray-800" };
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.fromPath}</TableCell>
                      <TableCell className="font-mono text-xs">{p.toPath || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${style.color}`}>{style.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-mono ${p.confidence > 98 ? "text-green-600" : p.confidence > 80 ? "text-yellow-600" : "text-red-600"}`}>
                          {Math.round(p.confidence)}%
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.endpoint}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(p.appliedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {p.success ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
                          {p.rolledBack && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Rolled back</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!p.rolledBack && p.success && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-orange-600" onClick={() => rollbackPatch(p.id)}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Rollback
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
