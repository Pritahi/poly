import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: Record<string, unknown> = { date: { gte: startDate } };
    if (projectId) where.projectId = projectId;

    const metrics = await db.usageMetric.findMany({
      where,
      orderBy: { date: "asc" },
    });

    const totals = {
      requestsMonitored: metrics.reduce((s, m) => s + m.requestsMonitored, 0),
      driftsDetected: metrics.reduce((s, m) => s + m.driftsDetected, 0),
      autoFixed: metrics.reduce((s, m) => s + m.autoFixed, 0),
      aiCalls: metrics.reduce((s, m) => s + m.aiCalls, 0),
      cacheHits: metrics.reduce((s, m) => s + m.cacheHits, 0),
      cacheMisses: metrics.reduce((s, m) => s + m.cacheMisses, 0),
    };

    return NextResponse.json({
      metrics,
      totals,
      cacheHitRatio: totals.cacheHits + totals.cacheMisses > 0
        ? Math.round((totals.cacheHits / (totals.cacheHits + totals.cacheMisses)) * 100)
        : 0,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 });
  }
}
