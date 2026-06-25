"use client";

import { useState } from "react";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Loader2,
  Cloud,
  Shield,
  Zap,
  GitBranch,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface BaselineData {
  source: string;
  mode: string;
  endpoint: string;
  schema: Record<string, unknown>;
  response: Record<string, unknown>;
  timestamp: string;
}

interface DriftData {
  source: string;
  mode: string;
  endpoint: string;
  driftDetected: Array<{
    type: string;
    from: string;
    to: string;
    severity: string;
    confidence: number;
  }>;
  patchesGenerated: Array<{
    type: string;
    from: string;
    to: string;
    confidence: number;
    reason: string;
  }>;
  protectedFieldsBlocked: Array<{ field: string; reason: string }>;
  response: Record<string, unknown>;
  originalResponse: Record<string, unknown>;
  patchedResponse: Record<string, unknown>;
  overallConfidence: number;
  autoPatch: boolean;
}

const DRIFT_TYPE_COLORS: Record<string, string> = {
  rename: "bg-blue-100 text-blue-800",
  missing_field: "bg-red-100 text-red-800",
  new_field: "bg-green-100 text-green-800",
  type_change: "bg-purple-100 text-purple-800",
  nullability: "bg-yellow-100 text-yellow-800",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "text-red-600",
  high: "text-orange-600",
  medium: "text-yellow-600",
  low: "text-green-600",
};

export function TestLabPage() {
  const [step, setStep] = useState(0); // 0=start, 1=loading, 2=baseline, 3=drift-loading, 4=drift
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null);
  const [driftData, setDriftData] = useState<DriftData | null>(null);
  const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
  const { toast } = useToast();

  const fetchBaseline = async () => {
    setStep(1);
    try {
      const res = await fetch("/api/test-lab?mode=baseline");
      const data = await res.json();
      setBaselineData(data);
      setStep(2);
      toast({ title: "Baseline learned!", description: "Weather API schema captured" });
    } catch {
      toast({ title: "Error", description: "Failed to fetch weather data", variant: "destructive" });
      setStep(0);
    }
  };

  const fetchDrifted = async () => {
    setStep(3);
    try {
      const res = await fetch("/api/test-lab?mode=drifted");
      const data = await res.json();
      setDriftData(data);
      setStep(4);
      toast({ title: "Drift detected!", description: `${data.driftDetected.length} schema changes found` });
    } catch {
      toast({ title: "Error", description: "Failed to simulate drift", variant: "destructive" });
      setStep(2);
    }
  };

  const runFullAnalysis = async () => {
    try {
      const res = await fetch("/api/test-lab?mode=analyze");
      const data = await res.json();
      setAnalysisData(data.analysis || data);
      toast({ title: "Analysis complete!", description: "Poly Cloud has analyzed the drift" });
    } catch {
      toast({ title: "Error", description: "Analysis failed", variant: "destructive" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Code copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Test Lab</h2>
        <p className="text-muted-foreground">
          Test Poly SDK with a real weather API — see baseline learning, drift detection, and auto-patching in action
        </p>
      </div>

      {/* How it works */}
      <Card className="border-dashed border-2">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cloud className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Using Open-Meteo Weather API (Delhi, India)</p>
              <p className="text-xs text-muted-foreground mt-1">
                Free public API, no API key needed. We fetch real weather data, then simulate schema drift
                to show how Poly detects and patches changes automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDK Install Code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Step 0: Install Poly SDK</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative group">
            <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 text-sm font-mono overflow-x-auto">
{`npm i github:Pritahi121/poly-sdk axios

// In your code:
import { Poly } from "pritpolytt-sdk"
import axios from "axios"

Poly.init({ apiKey: "poly_live_xxx" })
Poly.wrap(axios)

// Now all axios calls are monitored!`}
            </pre>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-zinc-800 text-zinc-300" onClick={() => copyCode(`npm i github:Pritahi121/poly-sdk axios`)}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Fetch Baseline */}
      <Card className={step >= 2 ? "border-green-200 bg-green-50/30" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {step < 2 ? <Play className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
            Step 1: Learn Baseline Schema
          </CardTitle>
          <CardDescription>
            Fetch real weather data — Poly SDK automatically learns the response schema as baseline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <Button onClick={fetchBaseline} size="lg" className="w-full sm:w-auto">
              <Play className="h-4 w-4 mr-2" />
              Fetch Weather & Learn Baseline
            </Button>
          )}
          {step === 1 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching from Open-Meteo API...
            </div>
          )}
          {step >= 2 && baselineData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Baseline learned from {baselineData.endpoint}
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">CAPTURED SCHEMA:</p>
                <pre className="text-xs font-mono text-foreground overflow-x-auto">
                  {JSON.stringify(baselineData.schema, null, 2)}
                </pre>
              </div>
              <div className="bg-white rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">ACTUAL API RESPONSE:</p>
                <pre className="text-xs font-mono text-foreground overflow-x-auto max-h-48">
                  {JSON.stringify(baselineData.response, null, 2)}
                </pre>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Cloud className="h-3 w-3" />
                Real weather data from Open-Meteo API • {new Date(baselineData.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Simulate Drift */}
      {step >= 2 && (
        <Card className={step >= 4 ? "border-orange-200 bg-orange-50/30" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {step < 4 ? <AlertTriangle className="h-4 w-4 text-orange-500" /> : <AlertTriangle className="h-4 w-4 text-orange-500" />}
              Step 2: Simulate API Schema Drift
            </CardTitle>
            <CardDescription>
              The API provider changed their schema! &quot;current&quot; → &quot;current_weather&quot;, &quot;temperature_2m&quot; → &quot;temp&quot;, new fields appeared
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 2 && (
              <Button onClick={fetchDrifted} size="lg" variant="outline" className="w-full sm:w-auto">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Simulate Drift (API Provider Changed Schema)
              </Button>
            )}
            {step === 3 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Simulating schema drift...
              </div>
            )}
            {step >= 4 && driftData && (
              <div className="space-y-4">
                {/* Drift Events */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    {driftData.driftDetected.length} Drift Events Detected
                  </p>
                  <div className="space-y-2">
                    {driftData.driftDetected.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg border text-sm">
                        <Badge variant="secondary" className={`text-xs ${DRIFT_TYPE_COLORS[d.type] || "bg-gray-100"}`}>
                          {d.type.replace("_", " ")}
                        </Badge>
                        <span className="font-mono text-xs">{d.from}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs">{d.to}</span>
                        <span className={`text-xs ml-auto ${SEVERITY_COLORS[d.severity] || ""}`}>{d.severity}</span>
                        <span className="text-xs text-muted-foreground">{d.confidence}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Protected Fields Blocked */}
                {driftData.protectedFieldsBlocked.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Shield className="h-4 w-4 text-red-500" />
                      Protected Fields — AI Blocked
                    </p>
                    {driftData.protectedFieldsBlocked.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200 text-sm">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="font-mono text-xs">{p.field}</span>
                        <span className="text-xs text-red-600">— {p.reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                {/* Patches Generated */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <GitBranch className="h-4 w-4 text-blue-500" />
                    {driftData.patchesGenerated.length} Patches Generated
                  </p>
                  <div className="space-y-2">
                    {driftData.patchesGenerated.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {p.type.replace("_", " ")}
                        </Badge>
                        <span className="font-mono text-xs">{p.from}</span>
                        <ArrowRight className="h-3 w-3 text-blue-400 shrink-0" />
                        <span className="font-mono text-xs">{p.to}</span>
                        <span className="text-xs ml-auto text-blue-600">{p.confidence}% confidence</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confidence Decision */}
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Overall Confidence: {driftData.overallConfidence}%</p>
                        <p className="text-xs text-muted-foreground">
                          {driftData.overallConfidence >= 98
                            ? "Above 98% threshold → Auto-patch will be applied"
                            : "Below 98% threshold → Alert only, no auto-patch"}
                        </p>
                      </div>
                      <Badge variant={driftData.autoPatch ? "default" : "secondary"} className="text-sm">
                        {driftData.autoPatch ? "✅ Auto-Patch" : "⚠️ Alert Only"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Before vs After Patching */}
      {step >= 4 && driftData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Step 3: Response Transformation
            </CardTitle>
            <CardDescription>
              See how Poly transforms the drifted response back to your expected schema — your code never breaks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="comparison" className="flex-1">Before vs After</TabsTrigger>
                <TabsTrigger value="drifted" className="flex-1">Drifted Response</TabsTrigger>
                <TabsTrigger value="patched" className="flex-1">Patched Response</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> BROKEN (Drifted API Response)
                    </p>
                    <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-mono overflow-auto max-h-80">
                      {JSON.stringify(driftData.response, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> FIXED (After Poly Patching)
                    </p>
                    <pre className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs font-mono overflow-auto max-h-80">
                      {JSON.stringify(driftData.patchedResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="drifted">
                <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs font-mono overflow-auto max-h-96 mt-4">
                  {JSON.stringify(driftData.response, null, 2)}
                </pre>
              </TabsContent>

              <TabsContent value="patched">
                <pre className="bg-green-50 border border-green-200 rounded-lg p-4 text-xs font-mono overflow-auto max-h-96 mt-4">
                  {JSON.stringify(driftData.patchedResponse, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            {/* Run full cloud analysis */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Run Full Poly Cloud Analysis</p>
                <p className="text-xs text-muted-foreground">Send drift to Poly Cloud AI for deep analysis</p>
              </div>
              <Button onClick={runFullAnalysis} variant="outline" size="sm">
                <Zap className="h-3 w-3 mr-1" /> Analyze with AI
              </Button>
            </div>
            {analysisData && (
              <div className="mt-3 bg-muted rounded-lg p-3">
                <pre className="text-xs font-mono overflow-auto max-h-48">
                  {JSON.stringify(analysisData, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reset */}
      {step >= 4 && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => { setStep(0); setBaselineData(null); setDriftData(null); setAnalysisData(null); }}>
            Reset Test
          </Button>
        </div>
      )}
    </div>
  );
}
