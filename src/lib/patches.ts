// Poly - Patch Generator & Local Transformer
import { PatchOperation, PatchType } from "./types";

export function generatePatch(
  type: PatchType,
  from: string,
  to: string,
  value?: unknown,
  confidence = 0,
  reason = ""
): PatchOperation {
  return { type, from, to, value, confidence, reason };
}

export function generateRenamePatch(from: string, to: string, confidence: number): PatchOperation {
  return generatePatch("rename", from, to, undefined, confidence, `Field renamed from "${from}" to "${to}"`);
}

export function generateRemovePatch(path: string, confidence: number): PatchOperation {
  return generatePatch("remove", path, "", undefined, confidence, `Removed field "${path}" from response`);
}

export function generateAddDefaultPatch(path: string, value: unknown, confidence: number): PatchOperation {
  return generatePatch("add_default", path, path, value, confidence, `Added default value for "${path}"`);
}

export function generateTypeConversionPatch(
  from: string,
  fromType: string,
  toType: string,
  confidence: number
): PatchOperation {
  return generatePatch(
    "type_conversion",
    from,
    from,
    undefined,
    confidence,
    `Safe type conversion from ${fromType} to ${toType} for "${from}"`
  );
}

// Local Transformer - applies patches to response objects in memory
export function applyPatches(data: unknown, patches: PatchOperation[]): unknown {
  if (!data || typeof data !== "object" || !Array.isArray(patches)) {
    return data;
  }

  // Deep clone to avoid mutating the original
  const result = JSON.parse(JSON.stringify(data));

  for (const patch of patches) {
    applyPatch(result, patch);
  }

  return result;
}

function applyPatch(obj: Record<string, unknown>, patch: PatchOperation): void {
  switch (patch.type) {
    case "rename":
      renameField(obj, patch.from, patch.to);
      break;
    case "remove":
      removeField(obj, patch.from);
      break;
    case "add_default":
      addDefaultField(obj, patch.from, patch.value);
      break;
    case "type_conversion":
      convertFieldType(obj, patch.from);
      break;
  }
}

function renameField(obj: Record<string, unknown>, fromPath: string, toPath: string): void {
  const fromParts = fromPath.split(".");
  const toParts = toPath.split(".");

  if (fromParts.length === 1 && toParts.length === 1) {
    if (fromParts[0] in obj) {
      obj[toParts[0]] = obj[fromParts[0]];
      delete obj[fromParts[0]];
    }
    return;
  }

  // Handle nested paths
  const fromParent = navigateToParent(obj, fromParts.slice(0, -1));
  const toParent = navigateToParent(obj, toParts.slice(0, -1));
  const fromKey = fromParts[fromParts.length - 1];
  const toKey = toParts[toParts.length - 1];

  if (fromParent && typeof fromParent === "object" && fromKey in fromParent) {
    if (toParent && typeof toParent === "object") {
      toParent[toKey] = fromParent[fromKey];
      delete fromParent[fromKey];
    }
  }
}

function removeField(obj: Record<string, unknown>, path: string): void {
  const parts = path.split(".");
  if (parts.length === 1) {
    delete obj[parts[0]];
    return;
  }
  const parent = navigateToParent(obj, parts.slice(0, -1));
  if (parent && typeof parent === "object") {
    delete parent[parts[parts.length - 1]];
  }
}

function addDefaultField(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  if (parts.length === 1) {
    if (!(parts[0] in obj)) {
      obj[parts[0]] = value ?? null;
    }
    return;
  }
  const parent = navigateToParent(obj, parts.slice(0, -1));
  if (parent && typeof parent === "object") {
    const key = parts[parts.length - 1];
    if (!(key in parent)) {
      parent[key] = value ?? null;
    }
  }
}

function convertFieldType(obj: Record<string, unknown>, path: string): void {
  const parts = path.split(".");
  let target: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (target && typeof target === "object") {
      target = (target as Record<string, unknown>)[parts[i]];
    } else {
      return;
    }
  }
  if (target && typeof target === "object") {
    const key = parts[parts.length - 1];
    const val = (target as Record<string, unknown>)[key];
    // Safe type conversions
    if (typeof val === "number") {
      (target as Record<string, unknown>)[key] = String(val);
    } else if (typeof val === "string") {
      const num = Number(val);
      if (!isNaN(num) && val.trim() !== "") {
        (target as Record<string, unknown>)[key] = num;
      }
    }
  }
}

function navigateToParent(obj: unknown, parts: string[]): unknown {
  let current = obj;
  for (const part of parts) {
    if (part === "[]") continue; // Skip array indicators
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[part];
    } else if (Array.isArray(current)) {
      current = current[0];
    } else {
      return null;
    }
  }
  return current;
}

// Validate that a patch actually fixes the drift
export function validatePatch(
  data: unknown,
  patches: PatchOperation[],
  expectedPaths: string[]
): boolean {
  const transformed = applyPatches(data, patches);
  if (!transformed || typeof transformed !== "object") return false;

  for (const path of expectedPaths) {
    const parts = path.split(".");
    let current: unknown = transformed;
    for (const part of parts) {
      if (part === "[]") {
        if (Array.isArray(current)) current = current[0];
        continue;
      }
      if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[part];
      } else {
        return false;
      }
    }
    if (current === undefined) return false;
  }
  return true;
}
