import { PatchOperation } from "./types";
export declare function generateCacheKey(tenantId: string, method: string, host: string, endpointPath: string, responseSignature: string): string;
export declare function getCachedPatch(key: string): PatchOperation[] | null;
export declare function setCachedPatch(key: string, tenantId: string, endpoint: string, patches: PatchOperation[], confidence: number): void;
export declare function invalidateCache(key: string): boolean;
export declare function invalidateEndpoint(tenantId: string, endpoint: string): number;
export declare function clearCache(): number;
export declare function getCacheStats(): {
    size: number;
    totalHits: number;
};
