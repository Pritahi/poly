"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  ArrowRight,
  Shield,
  Eye,
  GitBranch,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Play,
  RotateCcw,
  Terminal,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SimStep = "idle" | "request" | "response" | "baseline" | "drift" | "cloud" | "rules" | "patch" | "transform" | "done";

const STEPS: { id: SimStep; label: string; desc: string }[] = [
  { id: "request", label: "1. API Call", desc: "Your app makes a normal API request" },
  { id: "response", label: "2. Response", desc: "SDK intercepts the response" },
  { id: "baseline", label: "3. Baseline", desc: "Schema compared with learned baseline" },
  { id: "drift", label: "4. Drift Detected!", desc: "Schema has changed — drift found" },
  { id: "cloud", label: "5. Poly Cloud", desc: "Drift sent to AI (metadata only)" },
  { id: "rules", label: "6. Rule Engine", desc: "Protected fields blocked, safe fields allowed" },
  { id: "patch", label: "7. Patch Generated", desc: "AI creates safe mapping with confidence score" },
  { id: "transform", label: "8. Local Transform", desc: "Response patched in-memory — your code works!" },
];

export function LandingPage({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [simStep, setSimStep] = useState<SimStep>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay || !isPlaying) return;
    const stepOrder: SimStep[] = ["request", "response", "baseline", "drift", "cloud", "rules", "patch", "transform", "done"];
    const idx = stepOrder.indexOf(simStep);
    if (idx < stepOrder.length - 1) {
      const timer = setTimeout(() => setSimStep(stepOrder[idx + 1]), 1500);
      return () => clearTimeout(timer);
    } else if (simStep === "done") {
      // Use timeout to avoid setState in effect
      const timer2 = setTimeout(() => { setIsPlaying(false); setAutoPlay(false); }, 100);
      return () => clearTimeout(timer2);
    }
  }, [simStep, autoPlay, isPlaying]);

  const startSimulation = () => {
    setSimStep("request");
    setIsPlaying(true);
    setAutoPlay(true);
  };

  const resetSim = () => {
    setSimStep("idle");
    setIsPlaying(false);
    setAutoPlay(false);
  };

  const stepIdx = STEPS.findIndex((s) => s.id === simStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" /> V1 — Now Live on npm
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Survive Third-Party<br />
            <span className="text-primary">API Changes</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Poly detects schema drift, generates safe mappings, and patches responses locally.
            <br />
            <strong>Your traffic never passes through Poly servers.</strong>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onEnterDashboard} className="text-base px-8">
              Open Dashboard →
            </Button>
            <code className="bg-muted px-4 py-2.5 rounded-lg text-sm font-mono border">
              npm install poly-sdk
            </code>
          </div>
        </div>

        {/* 3-line install code */}
        <Card className="max-w-lg mx-auto mb-16">
          <CardContent className="p-4">
            <pre className="text-sm font-mono">
              <span className="text-purple-500">import</span>{" "}
              <span className="text-foreground">{"{ Poly }"}</span>{" "}
              <span className="text-purple-500">from</span>{" "}
              <span className="text-green-600">{"\"poly-sdk\""}</span>
              {"\n"}
              <span className="text-foreground">Poly</span>
              <span className="text-muted-foreground">.init</span>
              <span className="text-foreground">({"{ apiKey: "}</span>
              <span className="text-green-600">{"\"poly_live_xxx\""}</span>
              <span className="text-foreground">{" }"})</span>
              {"\n"}
              <span className="text-foreground">Poly</span>
              <span className="text-muted-foreground">.wrap</span>
              <span className="text-foreground">(axios)</span>
              <span className="text-muted-foreground">{"  // That's it!"}</span>
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Simulation */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">See How It Works</h2>
          <p className="text-muted-foreground">Watch Poly detect drift and patch your API response in real-time</p>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Button onClick={startSimulation} disabled={isPlaying} size="lg">
            <Play className="h-4 w-4 mr-2" /> Run Simulation
          </Button>
          <Button onClick={resetSim} variant="outline" size="lg">
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>

        {/* Flow Visualization */}
        <div className="bg-card border rounded-2xl p-6 md:p-8 mb-8">
          {/* Architecture Nodes */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            {/* Your App */}
            <div className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-500 w-full md:w-40 ${simStep === "request" ? "border-primary bg-primary/10 scale-105" : "border-border"}`}>
              <Terminal className="h-6 w-6 mb-2 text-primary" />
              <p className="text-sm font-bold">Your App</p>
              <p className="text-[10px] text-muted-foreground">axios.get("/api")</p>
            </div>

            <ArrowRight className={`h-5 w-5 shrink-0 transition-colors ${simStep === "request" ? "text-primary" : "text-muted-foreground"}`} />

            {/* Poly SDK */}
            <div className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-500 w-full md:w-40 ${["response", "baseline", "drift"].includes(simStep) ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 scale-105" : "border-border"}`}>
              <Package className="h-6 w-6 mb-2 text-amber-500" />
              <p className="text-sm font-bold">Poly SDK</p>
              <p className="text-[10px] text-muted-foreground">Intercepts locally</p>
            </div>

            <ArrowRight className={`h-5 w-5 shrink-0 transition-colors ${simStep === "cloud" ? "text-primary" : "text-muted-foreground"}`} />

            {/* Poly Cloud */}
            <div className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-500 w-full md:w-40 ${["cloud", "rules", "patch"].includes(simStep) ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 scale-105" : "border-border"}`}>
              <Cpu className="h-6 w-6 mb-2 text-purple-500" />
              <p className="text-sm font-bold">Poly Cloud</p>
              <p className="text-[10px] text-muted-foreground">AI + Rule Engine</p>
            </div>

            <ArrowRight className={`h-5 w-5 shrink-0 transition-colors ${simStep === "transform" ? "text-primary" : "text-muted-foreground"}`} />

            {/* Patched Response */}
            <div className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-500 w-full md:w-40 ${simStep === "done" || simStep === "transform" ? "border-green-500 bg-green-50 dark:bg-green-950/20 scale-105" : "border-border"}`}>
              <CheckCircle2 className="h-6 w-6 mb-2 text-green-500" />
              <p className="text-sm font-bold">Fixed!</p>
              <p className="text-[10px] text-muted-foreground">Code keeps working</p>
            </div>
          </div>

          {/* Step Details */}
          {simStep !== "idle" && (
            <div className="space-y-2">
              {STEPS.map((step, i) => {
                const isActive = step.id === simStep;
                const isDone = i < stepIdx;
                const isPending = i > stepIdx;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? step.id === "drift"
                          ? "bg-red-50 dark:bg-red-950/20 border border-red-200"
                          : "bg-primary/5 border border-primary/20"
                        : isDone
                        ? "bg-muted/50"
                        : "opacity-40"
                    }`}
                  >
                    <div className={`flex items-center justify-center h-7 w-7 rounded-full shrink-0 text-xs font-bold ${
                      isDone ? "bg-green-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                    {isActive && step.id === "drift" && (
                      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 animate-pulse" />
                    )}
                    {isActive && step.id === "rules" && (
                      <Shield className="h-5 w-5 text-purple-500 shrink-0" />
                    )}
                    {isDone && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}

          {simStep === "idle" && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">👆 Click <strong>&quot;Run Simulation&quot;</strong> to see Poly in action</p>
            </div>
          )}
        </div>

        {/* Live Code Example */}
        {simStep === "done" && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 mb-8">
            <CardHeader className="pb-2">
              <p className="text-sm font-bold text-green-700 dark:text-green-400">✅ Your code never breaks — here&apos;s what happened:</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">❌ Without Poly (broken):</p>
                  <pre className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-xs font-mono border border-red-200">
{`// API changed "name" to "full_name"
const user = response.data
console.log(user.name)
// → undefined 💥`}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">✅ With Poly (auto-fixed):</p>
                  <pre className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-xs font-mono border border-green-200">
{`// Poly patches response in memory
const user = response.data
console.log(user.name)
// → "John Doe" ✅ (patched!)`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: <Eye className="h-5 w-5" />, title: "Auto Detection", desc: "7 drift types detected automatically — no config needed" },
            { icon: <Shield className="h-5 w-5" />, title: "Protected Fields", desc: "AI never touches prices, payments, auth tokens" },
            { icon: <Database className="h-5 w-5" />, title: "Patch Cache", desc: "Reuse patches — no repeated AI calls" },
            { icon: <Lock className="h-5 w-5" />, title: "Zero Proxy", desc: "Traffic never passes through Poly. Local only." },
          ].map((f) => (
            <Card key={f.title} className="p-5">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">{f.icon}</div>
              <p className="text-sm font-semibold mb-1">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" onClick={onEnterDashboard} variant="outline" className="text-base px-8">
            Enter Dashboard →
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Poly — Survive Third-Party API Changes · MIT License · v1.0.0
      </footer>
    </div>
  );
}
