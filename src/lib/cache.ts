// Poly - In-Memory Patch Cache
import { PatchOperation } from "./types";

interface CacheEntry {
  key: string;
  tenantId: string;
  endpoint: string;
  method: string;
  host: string;
  responseSignature: string;
  patches: PatchOperation[];
  confidence: number;
  hitCount: number;
  valid: boolean;
  createdAt: number;
  lastUsed: number;
}

const cache = new Map<string, CacheEntry>();

export function generateCacheKey(
  tenantId: string,
  method: string,
  host: string,
  endpointPath: string,
  responseSignature: string
): string {
  const raw = `${tenantId}:${method}:${host}:${endpointPath}:${responseSignature}`;
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function getCachedPatch(key: string): PatchOperation[] | null {
  const entry = cache.get(key);
  if (!entry || !entry.valid) return null;
  entry.hitCount++;
  entry.lastUsed = Date.now();
  return entry.patches;
}

export function setCachedPatch(
  key: string,
  tenantId: string,
  endpoint: string,
  method: string,
  host: string,
  responseSignature: string,
  patches: PatchOperation[],
  confidence: number
): void {
  cache.set(key, {
    key,
    tenantId,
    endpoint,
    method,
    host,
    responseSignature,
    patches,
    confidence,
    hitCount: 0,
    valid: true,
    createdAt: Date.now(),
    lastUsed: Date.now(),
  });
}

export function invalidateCache(key: string): boolean {
  const entry = cache.get(key);
  if (entry) {
    entry.valid = false;
    cache.delete(key);
    return true;
  }
  return false;
}

export function getCacheStats(): {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
} {
  let totalHits = 0;
  let validEntries = 0;
  for (const entry of cache.values()) {
    if (entry.valid) {
      validEntries++;
      totalHits += entry.hitCount;
    }
  }
  return {
    size: cache.size,
    hits: totalHits,
    misses: 0,
    hitRate: validEntries > 0 ? totalHits / (totalHits + 1) : 0,
  };
}

export function getTenantPatches(tenantId: string): CacheEntry[] {
  const entries: CacheEntry[] = [];
  for (const entry of cache.values()) {
    if (entry.tenantId === tenantId && entry.valid) {
      entries.push(entry);
    }
  }
  return entries;
}

export function clearTenantCache(tenantId: string): number {
  let count = 0;
  for (const [key, entry] of cache.entries()) {
    if (entry.tenantId === tenantId) {
      cache.delete(key);
      count++;
    }
  }
  return count;
}
