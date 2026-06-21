// Poly AI Engine - Drift Analysis Service
// Runs on port 3030

const PORT = 3030;

interface SchemaField {
  name: string;
  type: string;
  path: string;
  nullable: boolean;
  isArray: boolean;
  children?: SchemaField[];
}

interface PatchOperation {
  type: "rename" | "remove" | "add_default" | "type_conversion";
  from: string;
  to: string;
  value?: unknown;
  confidence: number;
  reason: string;
}

interface RuleDefinition {
  type: "protected" | "safe" | "custom";
  field: string;
  action: "block" | "allow" | "warn";
}

interface AnalyzeRequest {
  tenantId: string;
  endpoint: string;
  method: string;
  expectedSchema: Record<string, unknown>;
  actualSchema: Record<string, unknown>;
  rules: RuleDefinition[];
}

interface DriftEvent {
  type: string;
  path: string;
  expectedType: string;
  actualType: string;
  severity: string;
}

const PROTECTED_FIELDS = ["amount", "price", "currency", "payment_status", "auth_token", "order_id"];

function isFieldProtected(fieldPath: string, rules: RuleDefinition[]): boolean {
  const fieldName = fieldPath.split(".").pop() || fieldPath;
  return rules.some(
    (r) => r.type === "protected" && r.action === "block" && (r.field === fieldName || fieldPath.endsWith(r.field))
  );
}

// Rule-based mapping engine (runs before AI)
function ruleBasedMapping(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  rules: RuleDefinition[]
): { patches: PatchOperation[]; driftEvents: DriftEvent[] } {
  const patches: PatchOperation[] = [];
  const driftEvents: DriftEvent[] = [];

  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);

  // Detect missing fields in actual
  for (const key of expectedKeys) {
    if (!(key in actual)) {
      // Check for rename heuristics
      const expectedType = typeof expected[key];
      let found = false;
      for (const aKey of actualKeys) {
        if (!expectedKeys.includes(aKey) && typeof actual[aKey] === expectedType) {
          const isProtected = isFieldProtected(key, rules);
          if (!isProtected) {
            patches.push({
              type: "rename",
              from: aKey,
              to: key,
              confidence: 85,
              reason: `Field "${aKey}" likely renamed from "${key}" (same type: ${expectedType})`,
            });
          }
          driftEvents.push({
            type: "rename",
            path: key,
            expectedType: expectedType,
            actualType: `renamed to ${aKey}`,
            severity: isProtected ? "critical" : "medium",
          });
          found = true;
          break;
        }
      }
      if (!found) {
        const isProtected = isFieldProtected(key, rules);
        driftEvents.push({
          type: "missing_field",
          path: key,
          expectedType: expectedType,
          actualType: "undefined",
          severity: isProtected ? "critical" : "high",
        });
      }
    } else {
      // Check type change
      const expectedType = typeof expected[key];
      const actualType = typeof actual[key];
      if (expectedType !== actualType) {
        const isProtected = isFieldProtected(key, rules);
        driftEvents.push({
          type: "type_change",
          path: key,
          expectedType,
          actualType,
          severity: isProtected ? "critical" : "high",
        });

        if (!isProtected) {
          patches.push({
            type: "type_conversion",
            from: key,
            to: key,
            confidence: 75,
            reason: `Type changed from ${expectedType} to ${actualType} for field "${key}"`,
          });
        }
      }
    }
  }

  // Detect new fields in actual
  for (const key of actualKeys) {
    if (!(key in expected)) {
      driftEvents.push({
        type: "new_field",
        path: key,
        expectedType: "undefined",
        actualType: typeof actual[key],
        severity: "low",
      });
    }
  }

  return { patches, driftEvents };
}

// AI-powered mapping engine
async function aiMapping(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  driftEvents: DriftEvent[],
  rules: RuleDefinition[]
): Promise<PatchOperation[]> {
  try {
    const { chat } = await import("z-ai-web-dev-sdk");
    const prompt = `You are Poly, an AI mapping engine that generates safe field mappings for API schema drift.

STRICT RULES:
- NEVER modify protected fields: ${PROTECTED_FIELDS.join(", ")}
- NEVER modify prices, payment fields, auth tokens, or business logic
- Only generate SAFE transformations (renames, safe type conversions, adding defaults)
- Each mapping must have a confidence score (0-100)

Expected schema: ${JSON.stringify(expected, null, 2)}
Actual schema: ${JSON.stringify(actual, null, 2)}
Detected drift events: ${JSON.stringify(driftEvents, null, 2)}
Protected fields per rules: ${rules.filter(r => r.type === "protected").map(r => r.field).join(", ")}

Generate patch operations as a JSON array. Each patch should have:
- type: "rename" | "remove" | "add_default" | "type_conversion"
- from: source field path
- to: target field path
- value: default value (for add_default only)
- confidence: 0-100
- reason: explanation

Return ONLY a valid JSON array of patches, no other text.`;

    const response = await chat({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices?.[0]?.message?.content || "";
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const aiPatches = JSON.parse(jsonMatch[0]) as PatchOperation[];
      // Filter out any patches that touch protected fields
      return aiPatches.filter((p) => !isFieldProtected(p.from, rules) && !isFieldProtected(p.to, rules));
    }
  } catch (error) {
    console.error("AI mapping failed, falling back to rule-based only:", error);
  }

  return [];
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/health") {
      return Response.json({ status: "ok", service: "poly-ai-engine", port: PORT });
    }

    // Analyze drift endpoint
    if (url.pathname === "/analyze-drift" && req.method === "POST") {
      try {
        const body = (await req.json()) as AnalyzeRequest;

        // Step 1: Rule-based mapping (runs BEFORE AI)
        const { patches: rulePatches, driftEvents } = ruleBasedMapping(
          body.expectedSchema,
          body.actualSchema,
          body.rules || []
        );

        // Step 2: AI mapping (enhances rule-based results)
        const aiPatches = await aiMapping(
          body.expectedSchema,
          body.actualSchema,
          driftEvents,
          body.rules || []
        );

        // Combine: AI patches supplement rule-based patches
        const allPatches = [...rulePatches, ...aiPatches];

        // Calculate overall confidence
        const avgConfidence =
          allPatches.length > 0
            ? allPatches.reduce((sum, p) => sum + p.confidence, 0) / allPatches.length
            : 0;

        return Response.json({
          mapping: allPatches,
          confidence: Math.round(avgConfidence * 100) / 100,
          reason:
            allPatches.length > 0
              ? `Generated ${allPatches.length} mapping operations (${rulePatches.length} rule-based, ${aiPatches.length} AI-enhanced)`
              : "No safe mappings could be generated",
          driftEvents,
        });
      } catch (error) {
        console.error("Analyze drift error:", error);
        return Response.json({ error: "Failed to analyze drift" }, { status: 500 });
      }
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
});

console.log(`Poly AI Engine running on port ${PORT}`);
