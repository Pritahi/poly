// Poly - AI Mapping Engine
// Rules run BEFORE AI. Protected fields are NEVER modified.

import { PatchOperation } from "./types";

const PROTECTED_FIELDS = ["amount", "price", "currency", "payment_status", "auth_token", "order_id"];

interface DriftEventSimple {
  type: string;
  path: string;
  expectedType: string;
  actualType: string;
  severity: string;
}

function isFieldProtected(fieldPath: string, rules: Array<{ type: string; field: string; action: string }>): boolean {
  const fieldName = fieldPath.split(".").pop() || fieldPath;
  return rules.some(
    (r) => r.type === "protected" && r.action === "block" && (r.field === fieldName || fieldPath.endsWith(r.field))
  );
}

// Rule-based mapping (runs before AI)
export function ruleBasedMapping(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  rules: Array<{ type: string; field: string; action: string }>
): { patches: PatchOperation[]; driftEvents: DriftEventSimple[] } {
  const patches: PatchOperation[] = [];
  const driftEvents: DriftEventSimple[] = [];

  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);
  const matchedActualKeys = new Set<string>();

  for (const key of expectedKeys) {
    if (!(key in actual)) {
      const expectedType = typeof expected[key];

      // Find best unmatched actual field with same type
      let bestMatch: string | null = null;
      for (const aKey of actualKeys) {
        if (!expectedKeys.includes(aKey) && typeof actual[aKey] === expectedType && !matchedActualKeys.has(aKey)) {
          bestMatch = aKey;
          break;
        }
      }

      if (bestMatch) {
        matchedActualKeys.add(bestMatch);
        const isProtected = isFieldProtected(key, rules);
        if (!isProtected) {
          patches.push({
            type: "rename",
            from: bestMatch,
            to: key,
            confidence: 85,
            reason: `Field "${bestMatch}" likely renamed from "${key}" (same type: ${expectedType})`,
          });
        }
        driftEvents.push({
          type: "rename", path: key, expectedType: expectedType,
          actualType: `renamed to ${bestMatch}`,
          severity: isProtected ? "critical" : "medium",
        });
      } else {
        const isProtected = isFieldProtected(key, rules);
        driftEvents.push({
          type: "missing_field", path: key, expectedType: expectedType,
          actualType: "undefined", severity: isProtected ? "critical" : "high",
        });
      }
    } else {
      const expectedType = typeof expected[key];
      const actualType = typeof actual[key];
      if (expectedType !== actualType) {
        const isProtected = isFieldProtected(key, rules);
        driftEvents.push({ type: "type_change", path: key, expectedType, actualType, severity: isProtected ? "critical" : "high" });
        if (!isProtected) {
          patches.push({ type: "type_conversion", from: key, to: key, confidence: 75, reason: `Type changed from ${expectedType} to ${actualType} for "${key}"` });
        }
      }
    }
  }

  for (const key of actualKeys) {
    if (!(key in expected) && !matchedActualKeys.has(key)) {
      driftEvents.push({ type: "new_field", path: key, expectedType: "undefined", actualType: typeof actual[key], severity: "low" });
    }
  }

  return { patches, driftEvents };
}

// AI-powered mapping engine
export async function aiMapping(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  driftEvents: DriftEventSimple[],
  rules: Array<{ type: string; field: string; action: string }>
): Promise<PatchOperation[]> {
  try {
    // Use z-ai-web-dev-sdk with proper API (default export = ZAI class)
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    
    const prompt = `You are Poly, an AI mapping engine that generates safe field mappings for API schema drift.

STRICT RULES:
- NEVER modify protected fields: ${PROTECTED_FIELDS.join(", ")}
- NEVER modify prices, payment fields, auth tokens, or business logic
- Only generate SAFE transformations (renames, safe type conversions, adding defaults)
- Each mapping must have a confidence score (0-100)
- CRITICAL: Match each actual field to EXACTLY ONE expected field based on semantic similarity
  Example: if expected has [name, email, age] and actual has [full_name, email_address, years]
  Then: full_name → name (same concept), email_address → email (same concept), years → age (same concept)
  Do NOT map one actual field to ALL expected fields!

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

    const response = await zai.chat.completions.create({
      model: "glm-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const aiPatches = JSON.parse(jsonMatch[0]) as PatchOperation[];
      return aiPatches.filter((p: PatchOperation) => !isFieldProtected(p.from, rules) && !isFieldProtected(p.to, rules));
    }
    
    console.log("AI response could not parse:", content.slice(0, 200));
  } catch (error) {
    console.error("AI mapping failed, rule-based only:", error instanceof Error ? error.message : String(error));
  }

  return [];
}
