"use client";

import { useState } from "react";
import { Code2, Copy, Terminal, Package, Zap, Shield, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

function CodeBlock({ code, language = "typescript" }: { code: string; language?: string }) {
  const { toast } = useToast();
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Code copied to clipboard" });
  };

  return (
    <div className="relative group">
      <pre className="bg-zinc-900 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-300 hover:text-white"
        onClick={copy}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function SdkDocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Poly SDK</h2>
        <p className="text-muted-foreground">Install, configure, and start monitoring your APIs in minutes</p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Quick Start
          </CardTitle>
          <CardDescription>Three lines to protect your app from API schema drift</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="npm" className="w-full">
            <TabsList>
              <TabsTrigger value="npm">npm</TabsTrigger>
              <TabsTrigger value="yarn">yarn</TabsTrigger>
              <TabsTrigger value="pnpm">pnpm</TabsTrigger>
            </TabsList>
            <TabsContent value="npm">
              <CodeBlock language="bash" code={`npm i poly-sdk`} />
            </TabsContent>
            <TabsContent value="yarn">
              <CodeBlock language="bash" code={`yarn add poly-sdk`} />
            </TabsContent>
            <TabsContent value="pnpm">
              <CodeBlock language="bash" code={`pnpm add poly-sdk`} />
            </TabsContent>
          </Tabs>
          <div className="mt-4">
            <CodeBlock language="typescript" code={`import { Poly } from "pritpolytt-sdk"\nimport axios from "axios"\n\n// 1. Initialize with your API key\nPoly.init({\n  apiKey: "poly_live_xxx"\n})\n\n// 2. Wrap your HTTP client\nPoly.wrap(axios)\n\n// That's it! All responses are now monitored.\n// Schema drift is detected and patched automatically.`} />
          </div>
        </CardContent>
      </Card>

      {/* Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-500" />
            How It Works
          </CardTitle>
          <CardDescription>Traffic never passes through Poly servers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-6 font-mono text-sm">
            <div className="space-y-2">
              <p className="text-blue-400 font-bold">Normal Flow:</p>
              <p className="text-muted-foreground">  Your App → Poly SDK → Third-party API</p>
              <p className="mt-4 text-amber-400 font-bold">When Drift Occurs:</p>
              <p className="text-muted-foreground">  Poly SDK → Poly Cloud (analyze)</p>
              <p className="text-muted-foreground">  Poly Cloud → Rule Engine → AI Mapping → Patch</p>
              <p className="text-muted-foreground">  Poly SDK ← Patch</p>
              <p className="text-muted-foreground">  Poly SDK → Local response transformation (in-memory)</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Shield className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-800">
              <strong>Your traffic never flows through Poly.</strong> The SDK intercepts responses locally,
              sends only schema metadata to the cloud for analysis, and applies patches in memory.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SDK Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-500" />
            Configuration
          </CardTitle>
          <CardDescription>Advanced SDK configuration options</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock language="typescript" code={`import { Poly } from "pritpolytt-sdk"\n\nPoly.init({\n  apiKey: "poly_live_xxx",\n  \n  // Optional: Custom endpoint (for self-hosted)\n  endpoint: "https://api.poly.dev",\n  \n  // Optional: Confidence threshold for auto-patching\n  // Default: 98 (patches with >98% confidence are auto-applied)\n  confidenceThreshold: 98,\n  \n  // Optional: Enable dry run mode (detect but don't patch)\n  dryRun: false,\n  \n  // Optional: Disable Poly entirely (e.g. for testing)\n  // Can also be set via: POLY_DISABLE=1\n  disable: false,\n  \n  // Optional: Custom rules for this project\n  rules: [\n    { type: "protected", field: "payment_status", action: "block" },\n    { type: "safe", field: "display_name", action: "allow" },\n  ],\n  \n  // Optional: Upload an OpenAPI spec for baseline\n  openApiSpec: require("./openapi.json"),\n  \n  // Optional: Provide Zod schemas for baseline\n  zodSchemas: { UserSchema, OrderSchema },\n})`} />
        </CardContent>
      </Card>

      {/* SDK Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Baseline Learning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Zero-config mode automatically learns schemas from your API responses. Power mode lets you
              upload OpenAPI specs or provide Zod schemas for precise baselines.
            </p>
            <CodeBlock language="typescript" code={`// Zero-config (automatic)\nPoly.wrap(axios) // Learns schema automatically\n\n// Power mode (explicit)\nPoly.init({\n  openApiSpec: require("./stripe-openapi.json")\n})`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Drift Detection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Detects missing fields, new fields, type changes, renames, nullability changes, enum changes,
              and nested path modifications automatically.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Missing field</Badge>
              <Badge variant="outline">New field</Badge>
              <Badge variant="outline">Type change</Badge>
              <Badge variant="outline">Rename</Badge>
              <Badge variant="outline">Nullability</Badge>
              <Badge variant="outline">Enum change</Badge>
              <Badge variant="outline">Array change</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rule Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Rules run BEFORE AI. Protected fields (amount, price, currency, auth_token) are never
              modified by the AI. Define custom rules for your specific needs.
            </p>
            <CodeBlock language="typescript" code={`Poly.init({\n  rules: [\n    { type: "protected", field: "payment_status", action: "block" },\n    { type: "safe", field: "avatar_url", action: "allow" },\n    { type: "custom", field: "tax_rate", action: "warn" },\n  ]\n})`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Patch Cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Patches are cached locally and reused. No repeated AI calls for the same drift pattern.
              Cache is automatically invalidated if patches no longer match.
            </p>
            <CodeBlock language="typescript" code={`// Patches are cached automatically\n// Cache key: tenant + method + host + path + signature\n\n// Manual cache invalidation\nPoly.invalidateCache("/api/v1/users")\n\n// Clear all caches\nPoly.clearCache()`} />
          </CardContent>
        </Card>
      </div>

      {/* Rollback & Kill Switch */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />
            Safety Features
          </CardTitle>
          <CardDescription>Built-in safety mechanisms for production use</CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock language="typescript" code={`// Dry run mode - detect but don't patch\nPoly.init({ dryRun: true })\n\n// Rollback a specific patch\nawait Poly.rollback("patch_id")\n\n// Kill switch - disable Poly entirely\n// Via environment variable:\n// POLY_DISABLE=1\n\n// Or programmatically:\nPoly.disable()\n\n// Re-enable:\nPoly.enable()\n\n// Listen for drift events\nPoly.on("drift", (event) => {\n  console.log("Drift detected:", event.type, event.path)\n})\n\nPoly.on("patch", (patch) => {\n  console.log("Patch applied:", patch.type, patch.from, "→", patch.to)\n})`} />
        </CardContent>
      </Card>

      {/* Current Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">V1 Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Axios", supported: true },
              { name: "fetch", supported: false },
              { name: "OpenAI SDK", supported: false },
              { name: "Stripe SDK", supported: false },
            ].map((item) => (
              <div key={item.name} className={`p-3 rounded-lg border text-center ${item.supported ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
                <p className="text-sm font-medium">{item.name}</p>
                <Badge variant={item.supported ? "default" : "secondary"} className="text-xs mt-1">
                  {item.supported ? "Supported" : "Coming Soon"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
