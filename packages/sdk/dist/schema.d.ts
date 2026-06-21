import { SchemaField } from "./types";
export declare function inferSchema(data: unknown, prefix?: string): SchemaField[];
export interface DriftResult {
    type: "missing_field" | "new_field" | "type_change" | "rename" | "nullability" | "array_change";
    path: string;
    expected: SchemaField | null;
    actual: SchemaField | null;
    severity: "critical" | "high" | "medium" | "low";
}
export declare function detectDrift(expected: SchemaField[], actual: SchemaField[]): DriftResult[];
export declare function serializeSchema(fields: SchemaField[]): Record<string, unknown>;
