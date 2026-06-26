import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { filterPatchesWithRules } from "@/lib/rules";
import { CONFIDENCE_THRESHOLD } from "@/lib/types";
import { generateCacheKey, getCachedPatch, setCachedPatch, invalidateCache } from "@/lib/cache";
import { validatePatch } from "@/lib/patches";
import { ruleBasedMapping, aiMapping } from "@/lib/ai-engine";

// Resolve tenantId: try API key first, fallback to project ID
async function resolveProject(tenantId: string): Promise<{ projectId: string } | null> {
  try {
    // Check if tenantId is an API key
    const apiKey = await db.apiKey.findFirst({ where: { key: tenantId, status: "active" } });
    if (apiKey) {
      // Mark key as used
      await db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date().toISOString() } }).catch(() => {});
      return { projectId: apiKey.projectId };
    }

    // Check if tenantId is a project ID directly
    const project = await db.project.findFirst({ where: { id: tenantId } });
    if (project) return { projectId: tenantId };

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, endpoint, method, expectedSchema, actualSchema, rules } = body;

    if (!tenantId || !endpoint) {
      return NextResponse.json({ error: "tenantId and endpoint are required" }, { status: 400 });
    }

    // Resolve project from API key or direct ID
    const projectRef = await resolveProject(tenantId);
    const projectId = projectRef?.projectId || tenantId;

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

    // Step 1: Rule-based mapping (runs BEFORE AI)
    const { patches: rulePatches, driftEvents } = ruleBasedMapping(
      expectedSchema || {},
      actualSchema || {},
      rules || []
    );

    // Step 2: AI mapping (enhances rule-based results)
    const aiPatches = await aiMapping(
      expectedSchema || {},
      actualSchema || {},
      driftEvents,
      rules || []
    );

    const allPatches = [...rulePatches, ...aiPatches];

    // Calculate overall confidence
    const analysisConfidence =
      allPatches.length > 0
        ? allPatches.reduce((sum, p) => sum + p.confidence, 0) / allPatches.length
        : 0;

    // Apply rules filter
    const { allowed, blocked } = filterPatchesWithRules(allPatches, rules || []);

    // Determine auto-patch vs alert
    const shouldAutoPatch = analysisConfidence >= CONFIDENCE_THRESHOLD && allowed.length > 0;

    if (shouldAutoPatch) {
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
      setCachedPatch(cacheKey, tenantId, endpoint, method || "GET", "api", responseSignature, allowed, analysisConfidence);
    }

    // Create incident record (with resolved project)
    if (projectRef && (driftEvents.length > 0 || allowed.length > 0 || blocked.length > 0)) {
      try {
        const incident = await db.incident.create({
          data: {
            projectId,
            endpoint,
            method: method || "GET",
            severity: allowed.length > 0 ? "medium" : "high",
            driftType: driftEvents[0]?.type || "type_change",
            expectedSchema: JSON.stringify(expectedSchema),
            actualSchema: JSON.stringify(actualSchema),
            confidence: analysisConfidence,
            status: shouldAutoPatch ? "resolved" : "open",
            autoFixed: shouldAutoPatch,
          },
        });

        for (const patch of allowed) {
          await db.patchHistory.create({
            data: {
              projectId,
              incidentId: incident.id,
              endpoint,
              patchType: patch.type,
              fromPath: patch.from,
              toPath: patch.to,
              confidence: patch.confidence,
              success: true,
            },
          });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await db.usageMetric.upsert({
          data: {
            projectId,
            date: today.toISOString(),
            requestsMonitored: 1,
            driftsDetected: driftEvents.length,
            autoFixed: shouldAutoPatch ? 1 : 0,
            aiCalls: 1,
            cacheHits: cachedPatches ? 1 : 0,
            cacheMisses: cachedPatches ? 0 : 1,
          },
          where: { projectId_date: { projectId, date: today } },
        });
      } catch (dbError) {
        console.error("DB write error (non-fatal):", dbError);
      }
    }

    return NextResponse.json({
      mapping: allowed,
      blocked,
      confidence: Math.round(analysisConfidence * 100) / 100,
      reason: allPatches.length > 0
        ? `Generated ${allPatches.length} mapping operations (${rulePatches.length} rule-based, ${aiPatches.length} AI-enhanced)`
        : "No safe mappings could be generated",
      autoPatch: shouldAutoPatch,
      cached: false,
      driftEvents,
    });
  } catch (error) {
    console.error("Analyze drift error:", error);
    return NextResponse.json({ error: "Failed to analyze drift" }, { status: 500 });
  }
}
