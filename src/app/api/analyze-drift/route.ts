import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { filterPatchesWithRules } from "@/lib/rules";
import { CONFIDENCE_THRESHOLD } from "@/lib/types";
import { generateCacheKey, getCachedPatch, setCachedPatch, invalidateCache } from "@/lib/cache";
import { applyPatches, validatePatch } from "@/lib/patches";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, endpoint, method, expectedSchema, actualSchema, rules } = body;

    if (!tenantId || !endpoint) {
      return NextResponse.json({ error: "tenantId and endpoint are required" }, { status: 400 });
    }

    // Check cache first
    const responseSignature = JSON.stringify(actualSchema).slice(0, 100);
    const cacheKey = generateCacheKey(tenantId, method || "GET", "api", endpoint, responseSignature);
    const cachedPatches = getCachedPatch(cacheKey);

    if (cachedPatches) {
      return NextResponse.json({
        mapping: cachedPatches,
        confidence: 99,
        reason: "Retrieved from patch cache",
        cached: true,
      });
    }

    // Call AI engine service
    let analysisResult;
    try {
      const aiRes = await fetch(`http://localhost:3030/analyze-drift?XTransformPort=3030`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, endpoint, method, expectedSchema, actualSchema, rules }),
      });
      analysisResult = await aiRes.json();
    } catch {
      // Fallback: return empty result if AI engine is down
      analysisResult = { mapping: [], confidence: 0, reason: "AI engine unavailable" };
    }

    // Apply rules
    const { allowed, blocked } = filterPatchesWithRules(analysisResult.mapping || [], rules || []);

    // Determine auto-patch vs alert
    const shouldAutoPatch = analysisResult.confidence >= CONFIDENCE_THRESHOLD && allowed.length > 0;

    if (shouldAutoPatch) {
      // Validate the patch
      const isValid = validatePatch(actualSchema, allowed, Object.keys(expectedSchema || {}));
      if (!isValid) {
        invalidateCache(cacheKey);
        return NextResponse.json({
          mapping: [],
          confidence: 0,
          reason: "Patch validation failed - cache invalidated",
          autoPatch: false,
        });
      }
    }

    // Cache the patches
    if (allowed.length > 0) {
      setCachedPatch(
        cacheKey,
        tenantId,
        endpoint,
        method || "GET",
        "api",
        responseSignature,
        allowed,
        analysisResult.confidence || 0
      );
    }

    // Create incident record
    const project = await db.project.findFirst({ where: { id: tenantId } });
    if (project && (analysisResult.driftEvents?.length > 0 || allowed.length > 0 || blocked.length > 0)) {
      await db.incident.create({
        data: {
          projectId: tenantId,
          endpoint,
          method: method || "GET",
          severity: allowed.length > 0 ? "medium" : "high",
          driftType: analysisResult.driftEvents?.[0]?.type || "type_change",
          expectedSchema: JSON.stringify(expectedSchema),
          actualSchema: JSON.stringify(actualSchema),
          confidence: analysisResult.confidence || 0,
          status: shouldAutoPatch ? "resolved" : "open",
          autoFixed: shouldAutoPatch,
        },
      });

      // Create patch history records
      for (const patch of allowed) {
        await db.patchHistory.create({
          data: {
            projectId: tenantId,
            endpoint,
            patchType: patch.type,
            fromPath: patch.from,
            toPath: patch.to,
            confidence: patch.confidence,
            success: true,
          },
        });
      }

      // Update usage metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await db.usageMetric.upsert({
        where: { projectId_date: { projectId: tenantId, date: today } },
        create: {
          projectId: tenantId,
          date: today,
          requestsMonitored: 1,
          driftsDetected: (analysisResult.driftEvents?.length) || 0,
          autoFixed: shouldAutoPatch ? 1 : 0,
          aiCalls: 1,
          cacheHits: cachedPatches ? 1 : 0,
          cacheMisses: cachedPatches ? 0 : 1,
        },
        update: {
          requestsMonitored: { increment: 1 },
          driftsDetected: { increment: (analysisResult.driftEvents?.length) || 0 },
          autoFixed: { increment: shouldAutoPatch ? 1 : 0 },
          aiCalls: { increment: 1 },
          cacheHits: { increment: cachedPatches ? 1 : 0 },
          cacheMisses: { increment: cachedPatches ? 0 : 1 },
        },
      });
    }

    return NextResponse.json({
      mapping: allowed,
      blocked,
      confidence: analysisResult.confidence || 0,
      reason: analysisResult.reason || "Analysis complete",
      autoPatch: shouldAutoPatch,
      cached: false,
      driftEvents: analysisResult.driftEvents || [],
    });
  } catch (error) {
    console.error("Analyze drift error:", error);
    return NextResponse.json({ error: "Failed to analyze drift" }, { status: 500 });
  }
}
