"use strict";
// Poly SDK - Patch Cache
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCacheKey = generateCacheKey;
exports.getCachedPatch = getCachedPatch;
exports.setCachedPatch = setCachedPatch;
exports.invalidateCache = invalidateCache;
exports.invalidateEndpoint = invalidateEndpoint;
exports.clearCache = clearCache;
exports.getCacheStats = getCacheStats;
const cache = new Map();
function generateCacheKey(tenantId, method, host, endpointPath, responseSignature) {
    const raw = `${tenantId}:${method}:${host}:${endpointPath}:${responseSignature}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}
function getCachedPatch(key) {
    const entry = cache.get(key);
    if (!entry)
        return null;
    entry.hitCount++;
    entry.lastUsed = Date.now();
    return entry.patches;
}
function setCachedPatch(key, tenantId, endpoint, patches, confidence) {
    cache.set(key, {
        key,
        tenantId,
        endpoint,
        patches,
        confidence,
        hitCount: 0,
        createdAt: Date.now(),
        lastUsed: Date.now(),
    });
}
function invalidateCache(key) {
    return cache.delete(key);
}
function invalidateEndpoint(tenantId, endpoint) {
    let count = 0;
    for (const [key, entry] of cache.entries()) {
        if (entry.tenantId === tenantId && entry.endpoint === endpoint) {
            cache.delete(key);
            count++;
        }
    }
    return count;
}
function clearCache() {
    const size = cache.size;
    cache.clear();
    return size;
}
function getCacheStats() {
    let totalHits = 0;
    for (const entry of cache.values()) {
        totalHits += entry.hitCount;
    }
    return { size: cache.size, totalHits };
}
