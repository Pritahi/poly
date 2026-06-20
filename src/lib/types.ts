// Poly - Core Types

export type DriftType =
  | "missing_field"
  | "new_field"
  | "type_change"
  | "rename"
  | "nullability"
  | "enum_change"
  | "array_change"
  | "nested_change";

export type Severity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "resolved" | "dismissed";
export type PatchType = "rename" | "remove" | "add_default" | "type_conversion";
export type RuleType = "protected" | "safe" | "custom";
export type RuleAction = "block" | "allow" | "warn";
export type AlertChannel = "email" | "slack" | "discord" | "webhook";
export type AlertEvent = "critical_drift" | "patch_failure" | "low_confidence";

export interface SchemaField {
  name: string;
  type: string;
  path: string;
  nullable: boolean;
  isArray: boolean;
  children?: SchemaField[];
}

export interface DriftEvent {
  type: DriftType;
  path: string;
  expected: SchemaField;
  actual: SchemaField;
  severity: Severity;
}

export interface PatchOperation {
  type: PatchType;
  from: string;
  to: string;
  value?: unknown;
  confidence: number;
  reason: string;
}

export interface DriftAnalysisRequest {
  tenantId: string;
  endpoint: string;
  method: string;
  expectedSchema: Record<string, unknown>;
  actualSchema: Record<string, unknown>;
  rules: RuleDefinition[];
}

export interface DriftAnalysisResponse {
  mapping: PatchOperation[];
  confidence: number;
  reason: string;
  driftEvents: DriftEvent[];
}

export interface RuleDefinition {
  type: RuleType;
  field: string;
  action: RuleAction;
}

export interface DashboardStats {
  requestsMonitored: number;
  driftsDetected: number;
  autoFixed: number;
  aiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRatio: number;
}

export interface TimeSeriesPoint {
  date: string;
  requests: number;
  drifts: number;
  autoFixed: number;
}

export const DEFAULT_PROTECTED_FIELDS: RuleDefinition[] = [
  { type: "protected", field: "amount", action: "block" },
  { type: "protected", field: "price", action: "block" },
  { type: "protected", field: "currency", action: "block" },
  { type: "protected", field: "payment_status", action: "block" },
  { type: "protected", field: "auth_token", action: "block" },
  { type: "protected", field: "order_id", action: "block" },
];

export const DEFAULT_SAFE_FIELDS: RuleDefinition[] = [
  { type: "safe", field: "name", action: "allow" },
  { type: "safe", field: "description", action: "allow" },
  { type: "safe", field: "avatar", action: "allow" },
  { type: "safe", field: "address", action: "allow" },
  { type: "safe", field: "email", action: "allow" },
];

export const CONFIDENCE_THRESHOLD = 98;
