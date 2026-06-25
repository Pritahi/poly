import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [
      projectCount,
      incidentCount,
      autoFixedCount,
      openIncidents,
      patchCount,
      patchCacheCount,
      apiKeyCount,
      ruleCount,
    ] = await Promise.all([
      db.project.count(),
      db.incident.count(),
      db.incident.count({ where: { autoFixed: true } }),
      db.incident.count({ where: { status: "open" } }),
      db.patchHistory.count({ where: { success: true } }),
      db.patchCache.count({ where: { valid: true } }),
      db.apiKey.count({ where: { status: "active" } }),
      db.rule.count(),
    ]);

    const recentIncidents = await db.incident.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const usageMetrics = await db.usageMetric.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "asc" },
    });

    const totalRequests = usageMetrics.reduce((s, m) => s + m.requestsMonitored, 0);
    const totalDrifts = usageMetrics.reduce((s, m) => s + m.driftsDetected, 0);
    const totalAutoFixed = usageMetrics.reduce((s, m) => s + m.autoFixed, 0);
    const totalAiCalls = usageMetrics.reduce((s, m) => s + m.aiCalls, 0);
    const totalCacheHits = usageMetrics.reduce((s, m) => s + m.cacheHits, 0);
    const totalCacheMisses = usageMetrics.reduce((s, m) => s + m.cacheMisses, 0);

    const criticalIncidents = await db.incident.count({ where: { severity: "critical" } });
    const highIncidents = await db.incident.count({ where: { severity: "high" } });
    const mediumIncidents = await db.incident.count({ where: { severity: "medium" } });
    const lowIncidents = await db.incident.count({ where: { severity: "low" } });

    const driftTypeCounts = await db.incident.groupBy({
      by: ["driftType"],
      _count: { driftType: true },
    });

    return NextResponse.json({
      stats: {
        projects: projectCount,
        totalIncidents: incidentCount,
        autoFixed: autoFixedCount,
        openIncidents,
        successfulPatches: patchCount,
        cachedPatches: patchCacheCount,
        activeApiKeys: apiKeyCount,
        rules: ruleCount,
        requestsMonitored: totalRequests,
        driftsDetected: totalDrifts,
        totalAutoFixed,
        aiCalls: totalAiCalls,
        cacheHits: totalCacheHits,
        cacheMisses: totalCacheMisses,
        cacheHitRatio: totalCacheHits + totalCacheMisses > 0
          ? Math.round((totalCacheHits / (totalCacheHits + totalCacheMisses)) * 100)
          : 0,
      },
      severityBreakdown: {
        critical: criticalIncidents,
        high: highIncidents,
        medium: mediumIncidents,
        low: lowIncidents,
      },
      driftTypeBreakdown: driftTypeCounts.map((d) => ({
        type: d.driftType,
        count: d._count.driftType,
      })),
      recentIncidents,
      timeSeries: usageMetrics.map((m) => ({
        date: m.date.toISOString().split("T")[0],
        requests: m.requestsMonitored,
        drifts: m.driftsDetected,
        autoFixed: m.autoFixed,
        aiCalls: m.aiCalls,
        cacheHits: m.cacheHits,
        cacheMisses: m.cacheMisses,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Dashboard API error:", msg);
    return NextResponse.json({ error: "Failed to load dashboard", detail: msg }, { status: 500 });
  }
}
