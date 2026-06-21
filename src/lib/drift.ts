// Poly - Drift Detection Engine
import { SchemaField, DriftEvent, DriftType, Severity } from "./types";

export function inferSchema(data: unknown, prefix = ""): SchemaField[] {
  if (data === null || data === undefined) {
    return [];
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return [{ name: "[]", type: "array", path: prefix, nullable: false, isArray: true, children: [] }];
    }
    const firstItem = data[0];
    const children = inferSchema(firstItem, `${prefix}[]`);
    return [{ name: "[]", type: "array", path: prefix, nullable: false, isArray: true, children }];
  }

  if (typeof data === "object") {
    const fields: SchemaField[] = [];
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value === null) {
        fields.push({ name: key, type: "null", path, nullable: true, isArray: false });
      } else if (Array.isArray(value)) {
        const children = value.length > 0 ? inferSchema(value[0], `${path}[]`) : [];
        fields.push({ name: key, type: "array", path, nullable: false, isArray: true, children });
      } else if (typeof value === "object") {
        const children = inferSchema(value, path);
        fields.push({ name: key, type: "object", path, nullable: false, isArray: false, children });
      } else {
        fields.push({ name: key, type: typeof value, path, nullable: false, isArray: false });
      }
    }
    return fields;
  }

  return [];
}

function fieldToMap(fields: SchemaField[], map: Map<string, SchemaField> = new Map()): Map<string, SchemaField> {
  for (const field of fields) {
    map.set(field.path, field);
    if (field.children) {
      fieldToMap(field.children, map);
    }
  }
  return map;
}

export function detectDrift(
  expected: SchemaField[],
  actual: SchemaField[],
): DriftEvent[] {
  const events: DriftEvent[] = [];
  const expectedMap = fieldToMap(expected);
  const actualMap = fieldToMap(actual);

  // Check for missing fields
  for (const [path, field] of expectedMap) {
    if (!actualMap.has(path)) {
      // Check if it was renamed (heuristic: similar type at different path)
      let renamed = false;
      for (const [actualPath, actualField] of actualMap) {
        if (
          !expectedMap.has(actualPath) &&
          actualField.type === field.type &&
          !actualPath.startsWith(path) &&
          !path.startsWith(actualPath)
        ) {
          events.push({
            type: "rename",
            path,
            expected: field,
            actual: actualField,
            severity: inferSeverity(field, "rename"),
          });
          renamed = true;
          break;
        }
      }
      if (!renamed) {
        events.push({
          type: "missing_field",
          path,
          expected: field,
          actual: { name: "", type: "undefined", path: "", nullable: true, isArray: false },
          severity: inferSeverity(field, "missing_field"),
        });
      }
    }
  }

  // Check for new fields and type changes
  for (const [path, field] of actualMap) {
    if (!expectedMap.has(path)) {
      // Skip if already detected as rename target
      const isRenameTarget = events.some(
        (e) => e.type === "rename" && e.actual.path === path
      );
      if (!isRenameTarget) {
        events.push({
          type: "new_field",
          path,
          expected: { name: "", type: "undefined", path: "", nullable: true, isArray: false },
          actual: field,
          severity: "low",
        });
      }
    } else {
      const expectedField = expectedMap.get(path)!;
      // Type change
      if (expectedField.type !== field.type) {
        events.push({
          type: "type_change",
          path,
          expected: expectedField,
          actual: field,
          severity: inferSeverity(expectedField, "type_change"),
        });
      }
      // Nullability change
      if (expectedField.nullable !== field.nullable) {
        events.push({
          type: "nullability",
          path,
          expected: expectedField,
          actual: field,
          severity: "medium",
        });
      }
    }
  }

  return events;
}

function inferSeverity(field: SchemaField, driftType: DriftType): Severity {
  const criticalPatterns = ["amount", "price", "payment", "auth", "token", "order", "currency"];
  const isCritical = criticalPatterns.some((p) => field.path.toLowerCase().includes(p));

  if (driftType === "type_change" && isCritical) return "critical";
  if (driftType === "missing_field" && isCritical) return "critical";
  if (driftType === "rename" && isCritical) return "high";
  if (driftType === "type_change") return "high";
  if (driftType === "missing_field") return "medium";
  return "medium";
}

export function schemaToJSON(fields: SchemaField[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.children && field.children.length > 0) {
      if (field.isArray) {
        result[field.name] = [schemaToJSON(field.children)];
      } else {
        result[field.name] = schemaToJSON(field.children);
      }
    } else {
      result[field.name] = field.type + (field.nullable ? "|null" : "");
    }
  }
  return result;
}
