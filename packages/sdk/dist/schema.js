"use strict";
// Poly SDK - Schema Learning Engine
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferSchema = inferSchema;
exports.detectDrift = detectDrift;
exports.serializeSchema = serializeSchema;
function inferSchema(data, prefix = "") {
    if (data === null || data === undefined)
        return [];
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return [{ name: "[]", type: "array", path: prefix, nullable: false, isArray: true, children: [] }];
        }
        const children = inferSchema(data[0], `${prefix}[]`);
        return [{ name: "[]", type: "array", path: prefix, nullable: false, isArray: true, children }];
    }
    if (typeof data === "object") {
        const fields = [];
        for (const [key, value] of Object.entries(data)) {
            const path = prefix ? `${prefix}.${key}` : key;
            if (value === null) {
                fields.push({ name: key, type: "null", path, nullable: true, isArray: false });
            }
            else if (Array.isArray(value)) {
                const children = value.length > 0 ? inferSchema(value[0], `${path}[]`) : [];
                fields.push({ name: key, type: "array", path, nullable: false, isArray: true, children });
            }
            else if (typeof value === "object") {
                const children = inferSchema(value, path);
                fields.push({ name: key, type: "object", path, nullable: false, isArray: false, children });
            }
            else {
                fields.push({ name: key, type: typeof value, path, nullable: false, isArray: false });
            }
        }
        return fields;
    }
    return [];
}
function fieldToMap(fields, map = new Map()) {
    for (const field of fields) {
        map.set(field.path, field);
        if (field.children)
            fieldToMap(field.children, map);
    }
    return map;
}
function detectDrift(expected, actual) {
    const events = [];
    const expectedMap = fieldToMap(expected);
    const actualMap = fieldToMap(actual);
    const criticalPatterns = ["amount", "price", "payment", "auth", "token", "order", "currency"];
    // Missing fields
    for (const [path, field] of expectedMap) {
        if (!actualMap.has(path)) {
            let renamed = false;
            for (const [actualPath, actualField] of actualMap) {
                if (!expectedMap.has(actualPath) && actualField.type === field.type) {
                    events.push({ type: "rename", path, expected: field, actual: actualField, severity: "medium" });
                    renamed = true;
                    break;
                }
            }
            if (!renamed) {
                const isCritical = criticalPatterns.some((p) => path.toLowerCase().includes(p));
                events.push({
                    type: "missing_field",
                    path,
                    expected: field,
                    actual: null,
                    severity: isCritical ? "critical" : "high",
                });
            }
        }
    }
    // New fields and type changes
    for (const [path, field] of actualMap) {
        if (!expectedMap.has(path)) {
            const isRenameTarget = events.some((e) => { var _a; return e.type === "rename" && ((_a = e.actual) === null || _a === void 0 ? void 0 : _a.path) === path; });
            if (!isRenameTarget) {
                events.push({ type: "new_field", path, expected: null, actual: field, severity: "low" });
            }
        }
        else {
            const expectedField = expectedMap.get(path);
            if (expectedField.type !== field.type) {
                const isCritical = criticalPatterns.some((p) => path.toLowerCase().includes(p));
                events.push({ type: "type_change", path, expected: expectedField, actual: field, severity: isCritical ? "critical" : "high" });
            }
            if (expectedField.nullable !== field.nullable) {
                events.push({ type: "nullability", path, expected: expectedField, actual: field, severity: "medium" });
            }
        }
    }
    return events;
}
function serializeSchema(fields) {
    const result = {};
    for (const field of fields) {
        if (field.children && field.children.length > 0) {
            result[field.name] = field.isArray ? [serializeSchema(field.children)] : serializeSchema(field.children);
        }
        else {
            result[field.name] = field.type + (field.nullable ? "|null" : "");
        }
    }
    return result;
}
