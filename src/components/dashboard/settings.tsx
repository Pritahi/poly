"use client";

import { useState } from "react";
import { Settings, Bell, Globe, Shield, Terminal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export function SettingsPage() {
  const { toast } = useToast();
  const [dryRun, setDryRun] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const saveSettings = () => {
    toast({ title: "Settings saved", description: "Your preferences have been updated" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure Poly behavior and alert channels</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Safety Mode
              </CardTitle>
              <CardDescription>Control how Poly handles detected schema drift</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Dry Run Mode</p>
                  <p className="text-xs text-muted-foreground">Detect drift but do not apply patches automatically</p>
                </div>
                <Switch checked={dryRun} onCheckedChange={setDryRun} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-patch (high confidence)</p>
                  <p className="text-xs text-muted-foreground">Automatically apply patches with confidence &gt; 98%</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Rollback on Failure</p>
                  <p className="text-xs text-muted-foreground">Automatically roll back patches that cause new errors</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alert Channels
              </CardTitle>
              <CardDescription>Get notified when critical drift is detected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium">Enable Alerts</p>
                  <p className="text-xs text-muted-foreground">Send notifications for critical events</p>
                </div>
                <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
              </div>
              <Separator />
              <div className="space-y-3">
                <Label>Email</Label>
                <Input
                  placeholder="alerts@company.com"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Receive email alerts for critical drift and patch failures</p>
              </div>
              <div className="space-y-3">
                <Label>Slack Webhook</Label>
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>Discord Webhook</Label>
                <Input
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>Custom Webhook</Label>
                <Input
                  placeholder="https://api.company.com/webhooks/poly"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">POST requests with incident details as JSON payload</p>
              </div>
              <Button onClick={saveSettings}>Save Alert Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alert Events</CardTitle>
              <CardDescription>Choose which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Critical Drift", desc: "Schema changes in protected fields", defaultChecked: true },
                { label: "Patch Failure", desc: "Auto-patch could not be applied", defaultChecked: true },
                { label: "Low Confidence", desc: "Mapping confidence below threshold", defaultChecked: false },
                { label: "New Field", desc: "Previously unseen field in response", defaultChecked: false },
              ].map((event) => (
                <div key={event.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{event.label}</p>
                    <p className="text-xs text-muted-foreground">{event.desc}</p>
                  </div>
                  <Switch defaultChecked={event.defaultChecked} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kill Switch</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Disable Poly entirely by setting the environment variable
                </p>
                <code className="block bg-muted p-3 rounded text-sm font-mono">POLY_DISABLE=1</code>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Cache TTL (seconds)</Label>
                <Input type="number" defaultValue={3600} className="w-32" />
                <p className="text-xs text-muted-foreground">How long patch caches remain valid</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Max AI Calls Per Minute</Label>
                <Input type="number" defaultValue={60} className="w-32" />
                <p className="text-xs text-muted-foreground">Rate limit for AI mapping engine calls</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>API Endpoint Override</Label>
                <Input placeholder="https://api.poly.dev" />
                <p className="text-xs text-muted-foreground">Custom Poly Cloud endpoint (for self-hosted)</p>
              </div>
              <Button onClick={saveSettings}>Save Advanced Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
