"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";

interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
  projectId: string;
  status: string;
  lastUsed: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
}

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = () => {
    Promise.all([
      fetch("/api/keys").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      .then(([keysData, projectsData]) => {
        setKeys(keysData.keys || []);
        setProjects(projectsData.projects || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const createKey = async () => {
    if (!newKeyName || !selectedProject) return;
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName, projectId: selectedProject, userId: "demo_user" }),
    });
    const data = await res.json();
    setNewlyCreatedKey(data.apiKey?.key || null);
    setNewKeyName("");
    setSelectedProject("");
    fetchData();
  };

  const deleteKey = async (id: string) => {
    await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
    fetchData();
    toast({ title: "API key deleted", description: "The key has been permanently removed" });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Copied!", description: "API key copied to clipboard" });
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-muted rounded" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">Manage API keys for your projects</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setNewlyCreatedKey(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>Generate a new API key for the Poly SDK</DialogDescription>
            </DialogHeader>
            {newlyCreatedKey ? (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                  <p className="text-sm font-medium text-green-800 mb-2">Your API Key (copy now!)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-2 py-1 rounded border flex-1 break-all">{newlyCreatedKey}</code>
                    <Button size="sm" variant="outline" onClick={() => copyKey(newlyCreatedKey)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-700 mt-2">This key will only be shown once. Store it securely.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Key Name</Label>
                  <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production Key" />
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              {!newlyCreatedKey && (
                <>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={createKey} disabled={!newKeyName || !selectedProject}>Generate Key</Button>
                </>
              )}
              {newlyCreatedKey && <Button onClick={() => setDialogOpen(false)}>Done</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Integration snippet */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Integration</CardTitle>
          <CardDescription>Install the Poly SDK and start monitoring in seconds</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-2">
            <p className="text-muted-foreground">{"// 1. Install the SDK"}</p>
            <p>npm i github:Pritahi/poly-sdk</p>
            <p className="text-muted-foreground mt-2">{"// 2. Initialize and wrap your HTTP client"}</p>
            <p>{"import { Poly } from 'pritpolytt-sdk'"}</p>
            <p>{"Poly.init({ apiKey: 'poly_live_xxx' })"}</p>
            <p>{"Poly.wrap(axios)"}</p>
            <p className="text-muted-foreground mt-2">{"// That's it! All responses are now monitored."}</p>
          </div>
        </CardContent>
      </Card>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Key className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No API keys yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {revealedKeys.has(k.id) ? k.key : k.key.slice(0, 15) + "..." + k.key.slice(-4)}
                      </code>
                    </TableCell>
                    <TableCell><Badge variant={k.status === "active" ? "default" : "secondary"}>{k.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleReveal(k.id)}>
                          {revealedKeys.has(k.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyKey(k.key)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteKey(k.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
