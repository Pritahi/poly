// Poly - Rule Engine
import { RuleDefinition, PatchOperation, DEFAULT_PROTECTED_FIELDS, DEFAULT_SAFE_FIELDS } from "./types";

export function getDefaultRules(): RuleDefinition[] {
  return [...DEFAULT_PROTECTED_FIELDS, ...DEFAULT_SAFE_FIELDS];
}

export function isFieldProtected(fieldPath: string, rules: RuleDefinition[]): boolean {
  const fieldName = fieldPath.split(".").pop() || fieldPath;
  return rules.some(
    (r) =>
      r.type === "protected" &&
      r.action === "block" &&
      (r.field === fieldName || fieldPath.endsWith(r.field))
  );
}

export function isFieldSafe(fieldPath: string, rules: RuleDefinition[]): boolean {
  const fieldName = fieldPath.split(".").pop() || fieldPath;
  return rules.some(
    (r) =>
      r.type === "safe" &&
      r.action === "allow" &&
      (r.field === fieldName || fieldPath.endsWith(r.field))
  );
}

export function filterPatchesWithRules(
  patches: PatchOperation[],
  rules: RuleDefinition[]
): { allowed: PatchOperation[]; blocked: PatchOperation[] } {
  const allowed: PatchOperation[] = [];
  const blocked: PatchOperation[] = [];

  for (const patch of patches) {
    const isFromProtected = isFieldProtected(patch.from, rules);
    const isToProtected = isFieldProtected(patch.to, rules);

    if (isFromProtected || isToProtected) {
      blocked.push(patch);
    } else {
      allowed.push(patch);
    }
  }

  return { allowed, blocked };
}

export function applyRulesToDrift(
  driftPath: string,
  rules: RuleDefinition[]
): { action: "block" | "allow" | "warn"; reason: string } {
  if (isFieldProtected(driftPath, rules)) {
    return {
      action: "block",
      reason: `Field "${driftPath}" is protected and cannot be modified by AI`,
    };
  }

  if (isFieldSafe(driftPath, rules)) {
    return {
      action: "allow",
      reason: `Field "${driftPath}" is marked as safe for auto-patching`,
    };
  }

  // Custom rules check
  const fieldName = driftPath.split(".").pop() || driftPath;
  const customRule = rules.find(
    (r) => r.type === "custom" && (r.field === fieldName || driftPath.endsWith(r.field))
  );

  if (customRule) {
    return {
      action: customRule.action as "block" | "allow" | "warn",
      reason: `Custom rule applies to "${driftPath}": ${customRule.action}`,
    };
  }

  // Default: warn for unknown fields
  return {
    action: "warn",
    reason: `Field "${driftPath}" is not in any rule list — requires manual review`,
  };
}
