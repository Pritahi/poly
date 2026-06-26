// Poly - AI Mapping Engine
// Cerebras Cloud (Llama 3.3 70B) — fast + free tier
// Rules run BEFORE AI. Protected fields NEVER modified.

import { PatchOperation } from "./types";

const CEREBRAS_API = "https://api.cerebras.ai/v1/chat/completions";
const CEREBRAS_KEY = "csk-ppypm5j9xhkyjyrkdxndp29jhjcme544mwj4p3n4w68w8mp3";
const MODEL = "llama-3.3-70b";

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
          patches.push({ type: "rename", from: bestMatch, to: key, confidence: 85,
            reason: `Field "${bestMatch}" likely renamed from "${key}" (same type: ${expectedType})` });
        }
        driftEvents.push({ type: "rename", path: key, expectedType,
          actualType: `renamed to ${bestMatch}`, severity: isProtected ? "critical" : "medium" });
      } else {
        const isProtected = isFieldProtected(key, rules);
        driftEvents.push({ type: "missing_field", path: key, expectedType,
          actualType: "undefined", severity: isProtected ? "critical" : "high" });
      }
    } else {
      const expectedType = typeof expected[key];
      const actualType = typeof actual[key];
      if (expectedType !== actualType) {
        const isProtected = isFieldProtected(key, rules);
        driftEvents.push({ type: "type_change", path: key, expectedType, actualType,
          severity: isProtected ? "critical" : "high" });
        if (!isProtected) {
          patches.push({ type: "type_conversion", from: key, to: key, confidence: 75,
            reason: `Type changed from ${expectedType} to ${actualType} for "${key}"` });
        }
      }
    }
  }
  for (const key of actualKeys) {
    if (!(key in expected) && !matchedActualKeys.has(key)) {
      driftEvents.push({ type: "new_field", path: key,
        expectedType: "undefined", actualType: typeof actual[key], severity: "low" });
    }
  }
  return { patches, driftEvents };
}

// AI-powered mapping via Cerebras Cloud (Llama 3.3 70B)
export async function aiMapping(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
  driftEvents: DriftEventSimple[],
  rules: Array<{ type: string; field: string; action: string }>
): Promise<PatchOperation[]> {
  const protectedRuleFields = rules.filter(r => r.type === "protected").map(r => r.field);
  
  try {
    const prompt = `You are Poly, an AI that maps API schema drift safely.

RULES:
- NEVER touch protected fields: ${PROTECTED_FIELDS.join(", ")} ${protectedRuleFields.length ? "+ " + protectedRuleFields.join(", ") : ""}
- Match each actual field to ONE expected field based on semantic similarity
- Confidence 0-100 for each mapping
- Type: "rename", "remove", "add_default", or "type_conversion"

Expected schema: ${JSON.stringify(expected)}
Actual schema: ${JSON.stringify(actual)}
Drift events: ${JSON.stringify(driftEvents)}

Return ONLY valid JSON array:
[{"type":"rename","from":"full_name","to":"name","confidence":95,"reason":"..."}]`;

    const response = await fetch(CEREBRAS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CEREBRAS_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => "");
      console.error(`Cerebras API error ${response.status}: ${err.slice(0, 200)}`);
      return [];
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const aiPatches = JSON.parse(jsonMatch[0]) as PatchOperation[];
      return aiPatches.filter((p: PatchOperation) =>
        !isFieldProtected(p.from, rules) && !isFieldProtected(p.to, rules)
      );
    }

    console.log("Cerebras response (no JSON):", content.slice(0, 200));
  } catch (error) {
    console.error("Cerebras AI failed:", error instanceof Error ? error.message : String(error));
  }

  return [];
}
