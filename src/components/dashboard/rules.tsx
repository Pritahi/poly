"use client";

import { useEffect, useState } from "react";
import { Shield, Plus, Trash2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CONFIDENCE_THRESHOLD } from "@/lib/types";

interface Rule {
  id: string;
  projectId: string;
  type: string;
  field: string;
  action: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

export function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<"protected" | "safe" | "custom">("protected");
  const [newField, setNewField] = useState("");
  const [newAction, setNewAction] = useState<"block" | "allow" | "warn">("block");
  const [selectedProject, setSelectedProject] = useState("");
  const [confidenceThreshold, setConfidenceThreshold] = useState(CONFIDENCE_THRESHOLD);

  const fetchData = () => {
    Promise.all([
      fetch("/api/rules").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([rulesData, projectsData]) => {
        setRules(rulesData.rules || []);
        setProjects(projectsData.projects || []);
        if (projectsData.projects?.length > 0 && !selectedProject) {
          setSelectedProject(projectsData.projects[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const createRule = async () => {
    if (!newField || !selectedProject) return;
    await fetch("/api/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject, type: newType, field: newField, action: newAction }),
    });
    setNewField("");
    setDialogOpen(false);
    fetchData();
  };

  const deleteRule = async (id: string) => {
    await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const protectedRules = rules.filter((r) => r.type === "protected");
  const safeRules = rules.filter((r) => r.type === "safe");
  const customRules = rules.filter((r) => r.type === "custom");

  if (loading) return <div className="animate-pulse h-96 bg-muted rounded" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rules</h2>
          <p className="text-muted-foreground">Define which fields the AI can and cannot modify</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Rule</DialogTitle>
              <DialogDescription>Define a field rule for AI patch safety</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select value={newType} onValueChange={(v) => {
                  setNewType(v as "protected" | "safe" | "custom");
                  if (v === "protected") setNewAction("block");
                  if (v === "safe") setNewAction("allow");
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="protected">Protected (AI cannot modify)</SelectItem>
                    <SelectItem value="safe">Safe (AI can modify)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Field Name</Label>
                <Input value={newField} onChange={(e) => setNewField(e.target.value)} placeholder="e.g. payment_amount" />
              </div>
              {newType === "custom" && (
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select value={newAction} onValueChange={(v) => setNewAction(v as "block" | "allow" | "warn")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={createRule} disabled={!newField || !selectedProject}>Add Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Confidence Threshold */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Confidence Threshold
          </CardTitle>
          <CardDescription>
            Patches with confidence above this threshold are auto-applied. Below it, they are only alerted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={0}
              max={100}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">% — Only patches with confidence &gt; {confidenceThreshold}% are auto-applied</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${confidenceThreshold}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Protected Fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            Protected Fields
          </CardTitle>
          <CardDescription>AI must NEVER modify these fields. They are blocked from all auto-patching.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {protectedRules.map((r) => (
              <div key={r.id} className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-800 rounded-md px-3 py-1.5 text-sm">
                <ShieldAlert className="h-3 w-3" />
                <span className="font-mono">{r.field}</span>
                <button onClick={() => deleteRule(r.id)} className="ml-1 text-red-400 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {protectedRules.length === 0 && <p className="text-sm text-muted-foreground">No protected fields defined</p>}
          </div>
        </CardContent>
      </Card>

      {/* Safe Fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            Safe Fields
          </CardTitle>
          <CardDescription>These fields are approved for AI auto-patching without manual review.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {safeRules.map((r) => (
              <div key={r.id} className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-800 rounded-md px-3 py-1.5 text-sm">
                <ShieldCheck className="h-3 w-3" />
                <span className="font-mono">{r.field}</span>
                <button onClick={() => deleteRule(r.id)} className="ml-1 text-green-400 hover:text-green-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {safeRules.length === 0 && <p className="text-sm text-muted-foreground">No safe fields defined</p>}
          </div>
        </CardContent>
      </Card>

      {/* Custom Rules */}
      {customRules.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Custom Rules</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="w-16">Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customRules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.field}</TableCell>
                    <TableCell>
                      <Badge variant={r.action === "block" ? "destructive" : r.action === "allow" ? "default" : "secondary"}>
                        {r.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.projectId}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRule(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
