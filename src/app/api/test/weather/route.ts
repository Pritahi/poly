// Test Lab API — Weather API + Poly SDK Simulation
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inferSchema, detectDrift, serializeSchema } from "@/lib/drift";

// Store baselines in memory for testing
const baselines = new Map<string, ReturnType<typeof inferSchema>>();

const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";

async function fetchWeather(city: string): Promise<Record<string, unknown>> {
  const geoRes = await fetch(`${GEO_API}?name=${encodeURIComponent(city)}&count=1`);
  const geoData = (await geoRes.json()) as {
    results?: Array<{ latitude: number; longitude: number; name: string; country: string }>;
  };

  if (!geoData.results?.length) throw new Error(`City "${city}" not found`);

  const { latitude, longitude, name, country } = geoData.results[0];

  const weatherRes = await fetch(
    `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
  );
  const weatherData = (await weatherRes.json()) as Record<string, unknown>;

  return { city: name, country, latitude, longitude, ...weatherData };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, city, projectId } = body;
    const projId = projectId || "proj_demo_01";

    switch (action) {
      case "learn_baseline": {
        const weather = await fetchWeather(city || "London");
        const schema = inferSchema(weather);
        const endpoint = `/weather/${(city || "London").toLowerCase()}`;
        baselines.set(endpoint, schema);

        return NextResponse.json({
          success: true,
          action: "learn_baseline",
          endpoint,
          city: weather.city,
          country: weather.country,
          weatherData: weather,
          schema: serializeSchema(schema),
          schemaFields: schema.map((f) => ({
            name: f.name,
            type: f.type,
            path: f.path,
            nullable: f.nullable,
            isArray: f.isArray,
            childrenCount: f.children?.length || 0,
          })),
          message: `Baseline learned for ${weather.city}, ${weather.country}. Schema has ${schema.length} top-level fields.`,
        });
      }

      case "check_drift": {
        const endpoint = `/weather/${(city || "London").toLowerCase()}`;
        const baseline = baselines.get(endpoint);
        if (!baseline) {
          return NextResponse.json({ success: false, error: "No baseline found. Run 'Learn Baseline' first!" });
        }

        const weather = await fetchWeather(city || "London");
        const currentSchema = inferSchema(weather);
        const driftEvents = detectDrift(baseline, currentSchema);
        const rules = await db.rule.findMany({ where: { projectId: projId } });

        return NextResponse.json({
          success: true,
          action: "check_drift",
          endpoint,
          city: weather.city,
          weatherData: weather,
          currentSchema: serializeSchema(currentSchema),
          driftEvents: driftEvents.map((d) => ({
            type: d.type,
            path: d.path,
            expectedType: d.expected?.type || "unknown",
            actualType: d.actual?.type || "unknown",
            severity: d.severity,
          })),
          driftCount: driftEvents.length,
          rules: rules.map((r) => ({ type: r.type, field: r.field, action: r.action })),
          message: driftEvents.length === 0
            ? "No drift detected — schema matches baseline ✅"
            : `⚠️ ${driftEvents.length} drift(s) detected!`,
        });
      }

      case "simulate_drift": {
        const endpoint = `/weather/${(city || "London").toLowerCase()}`;
        const baseline = baselines.get(endpoint);
        if (!baseline) {
          return NextResponse.json({ success: false, error: "No baseline found. Run 'Learn Baseline' first!" });
        }

        const simulatedDrifts = [
          { type: "rename", description: "Field 'temperature_2m' renamed to 'temp_celsius'", from: "temperature_2m", to: "temp_celsius", patchType: "rename", confidence: 94, severity: "medium" },
          { type: "type_change", description: "Field 'wind_speed_10m' changed from number to string", from: "wind_speed_10m", to: "wind_speed_10m", patchType: "type_conversion", confidence: 82, severity: "high" },
          { type: "new_field", description: "New field 'uv_index' appeared in response", from: "", to: "uv_index", patchType: "add_default", confidence: 88, severity: "low" },
          { type: "missing_field", description: "Field 'weather_code' removed from response", from: "weather_code", to: "", patchType: "add_default", confidence: 71, severity: "high" },
        ];

        const rules = await db.rule.findMany({ where: { projectId: projId } });
        const protectedFields = rules.filter((r) => r.type === "protected").map((r) => r.field);

        const patches = simulatedDrifts
          .filter((d) => !protectedFields.some((pf) => d.from.includes(pf) || d.to.includes(pf)))
          .map((d) => ({ type: d.patchType, from: d.from, to: d.to, confidence: d.confidence, reason: d.description }));

        const blockedPatches = simulatedDrifts
          .filter((d) => protectedFields.some((pf) => d.from.includes(pf) || d.to.includes(pf)))
          .map((d) => ({ type: d.patchType, from: d.from, to: d.to, confidence: d.confidence, reason: `BLOCKED: ${d.description}` }));

        // Create incidents in DB
        for (const drift of simulatedDrifts) {
          await db.incident.create({
            data: {
              projectId: projId,
              endpoint,
              method: "GET",
              severity: drift.severity,
              driftType: drift.type,
              expectedSchema: JSON.stringify(serializeSchema(baseline)),
              actualSchema: JSON.stringify({ drifted: true }),
              confidence: drift.confidence,
              status: drift.confidence >= 98 ? "resolved" : "open",
              autoFixed: drift.confidence >= 98,
            },
          });
        }

        for (const patch of patches) {
          await db.patchHistory.create({
            data: {
              projectId: projId,
              endpoint,
              patchType: patch.type,
              fromPath: patch.from,
              toPath: patch.to,
              confidence: patch.confidence,
              success: patch.confidence >= 98,
            },
          });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await db.usageMetric.upsert({
          where: { projectId_date: { projectId: projId, date: today } },
          create: { projectId: projId, date: today, requestsMonitored: 5, driftsDetected: simulatedDrifts.length, autoFixed: patches.filter((p) => p.confidence >= 98).length, aiCalls: 1, cacheHits: 0, cacheMisses: 1 },
          update: { requestsMonitored: { increment: 5 }, driftsDetected: { increment: simulatedDrifts.length }, autoFixed: { increment: patches.filter((p) => p.confidence >= 98).length }, aiCalls: { increment: 1 }, cacheMisses: { increment: 1 } },
        });

        return NextResponse.json({
          success: true,
          action: "simulate_drift",
          endpoint,
          simulatedDrifts,
          patches: patches.map((p) => ({ ...p, autoApplied: p.confidence >= 98 })),
          blockedPatches,
          protectedFields,
          message: `Simulated ${simulatedDrifts.length} drifts: ${patches.length} patches (${patches.filter((p) => p.confidence >= 98).length} auto-applied), ${blockedPatches.length} blocked`,
        });
      }

      case "auto_fix": {
        const endpoint = `/weather/${(city || "London").toLowerCase()}`;
        const baseline = baselines.get(endpoint);
        if (!baseline) {
          return NextResponse.json({ success: false, error: "No baseline found. Run 'Learn Baseline' first!" });
        }

        const weather = await fetchWeather(city || "London");
        const currentSchema = inferSchema(weather);
        const driftEvents = detectDrift(baseline, currentSchema);

        if (driftEvents.length === 0) {
          return NextResponse.json({ success: true, action: "auto_fix", message: "No drift to fix — schema already matches! ✅", patches: [] });
        }

        const rules = await db.rule.findMany({ where: { projectId: projId } });

        const analyzeRes = await fetch("http://localhost:3000/api/analyze-drift", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: projId,
            endpoint,
            method: "GET",
            expectedSchema: serializeSchema(baseline),
            actualSchema: serializeSchema(currentSchema),
            rules: rules.map((r) => ({ type: r.type, field: r.field, action: r.action })),
          }),
        });

        const analysisResult = (await analyzeRes.json()) as {
          mapping: Array<{ type: string; from: string; to: string; confidence: number; reason: string }>;
          blocked: Array<{ type: string; from: string; to: string; confidence: number; reason: string }>;
          confidence: number;
          reason: string;
          autoPatch: boolean;
        };

        return NextResponse.json({
          success: true,
          action: "auto_fix",
          endpoint,
          driftCount: driftEvents.length,
          analysis: {
            patchesGenerated: analysisResult.mapping?.length || 0,
            patchesBlocked: analysisResult.blocked?.length || 0,
            overallConfidence: analysisResult.confidence,
            autoPatched: analysisResult.autoPatch,
            reason: analysisResult.reason,
            patches: (analysisResult.mapping || []).map((p) => ({
              type: p.type,
              from: p.from,
              to: p.to,
              confidence: p.confidence,
              reason: p.reason,
              autoApplied: analysisResult.autoPatch && p.confidence >= 98,
            })),
            blocked: (analysisResult.blocked || []).map((p) => ({
              type: p.type,
              from: p.from,
              to: p.to,
              confidence: p.confidence,
              reason: `BLOCKED: ${p.reason}`,
            })),
          },
          message: analysisResult.autoPatch
            ? `✅ Auto-fixed! ${analysisResult.mapping?.length || 0} patches applied (confidence: ${analysisResult.confidence}%)`
            : `⚠️ ${analysisResult.mapping?.length || 0} patches generated but not auto-applied (confidence: ${analysisResult.confidence}% < 98%)`,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
