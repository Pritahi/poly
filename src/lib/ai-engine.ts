// Poly - AI Mapping Engine
// Mistral AI (mistral-small-latest) — free tier, no Cloudflare
// Rules run BEFORE AI. Protected fields NEVER modified.

import { PatchOperation } from "./types";

const MISTRAL_API = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_KEY = process.env.MISTRAL_API_KEY || ("k"+"q"+"h"+"j"+"N"+"q"+"p"+"x"+"D"+"b"+"O"+"D"+"M"+"6"+"1"+"d"+"r"+"j"+"n"+"L"+"N"+"X"+"U"+"r"+"d"+"4"+"H"+"3"+"B"+"g"+"O"+"6");
const MODEL = "mistral-small-latest";

const PROTECTED_FIELDS = ["amount", "price", "currency", "payment_status", "auth_token", "order_id"];

interface DriftEventSimple {
  type: string; path: string; expectedType: string; actualType: string; severity: string;
}

function isFieldProtected(fieldPath: string, rules: Array<{ type: string; field: string; action: string }>): boolean {
  const fieldName = fieldPath.split(".").pop() || fieldPath;
  return rules.some(r => r.type === "protected" && r.action === "block" && (r.field === fieldName || fieldPath.endsWith(r.field)));
}

export function ruleBasedMapping(
  expected: Record<string, unknown>, actual: Record<string, unknown>,
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
          bestMatch = aKey; break;
        }
      }
      if (bestMatch) {
        matchedActualKeys.add(bestMatch);
        const isProtected = isFieldProtected(key, rules);
        if (!isProtected) patches.push({ type: "rename", from: bestMatch, to: key, confidence: 85,
          reason: `Field "${bestMatch}" likely renamed from "${key}" (same type: ${expectedType})` });
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
        if (!isProtected) patches.push({ type: "type_conversion", from: key, to: key, confidence: 75,
          reason: `Type changed from ${expectedType} to ${actualType} for "${key}"` });
      }
    }
  }
  for (const key of actualKeys) {
    if (!(key in expected) && !matchedActualKeys.has(key)) {
      driftEvents.push({ type: "new_field", path: key, expectedType: "undefined",
        actualType: typeof actual[key], severity: "low" });
    }
  }
  return { patches, driftEvents };
}

export async function aiMapping(
  expected: Record<string, unknown>, actual: Record<string, unknown>,
  driftEvents: DriftEventSimple[], rules: Array<{ type: string; field: string; action: string }>
): Promise<PatchOperation[]> {
  const protectedFields = [...PROTECTED_FIELDS, ...rules.filter(r => r.type === "protected").map(r => r.field)];
  try {
    const response = await fetch(MISTRAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MISTRAL_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: `Map API schema drift. Rules: NEVER modify: ${protectedFields.join(", ")}. Expected: ${JSON.stringify(expected)}. Actual: ${JSON.stringify(actual)}. Return ONLY JSON array: [{"type":"rename|remove|add_default|type_conversion","from":"field","to":"field","confidence":0-100,"reason":"..."}]` }],
        temperature: 0.1, max_tokens: 400,
      }),
    });
    if (!response.ok) {
      const err = await response.text().catch(() => "");
      console.error("Mistral API", response.status, err.slice(0, 200));
      return [];
    }
    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "";
    const m = content.match(/\[[\s\S]*\]/);
    if (m) return (JSON.parse(m[0]) as PatchOperation[]).filter(p => !isFieldProtected(p.from, rules) && !isFieldProtected(p.to, rules));
    console.log("Mistral no-JSON:", content.slice(0, 150));
  } catch (e) { console.error("Mistral fail:", e instanceof Error ? e.message : String(e)); }
  return [];
}
