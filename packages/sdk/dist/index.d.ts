import { PolyConfig, DriftEvent, PatchOperation, AxiosInstance, SchemaField } from "./types";
type Listener = (event: DriftEvent | PatchOperation | Error) => void;
export declare const Poly: {
    /**
     * Initialize the Poly SDK with your API key and options
     */
    init(options: PolyConfig): void;
    /**
     * Wrap an Axios instance to intercept responses and detect drift
     */
    wrap(axios: AxiosInstance): AxiosInstance;
    /**
     * Manually process a response (for non-Axios clients)
     */
    analyzeResponse(requestConfig: Record<string, unknown>, responseData: unknown): void;
    /**
     * Invalidate cache for a specific endpoint
     */
    invalidateCache(endpoint: string): number;
    /**
     * Clear all cached patches
     */
    clearCache(): number;
    /**
     * Disable Poly entirely (kill switch)
     */
    disable(): void;
    /**
     * Re-enable Poly
     */
    enable(): void;
    /**
     * Check if Poly is disabled
     */
    isDisabled(): boolean;
    /**
     * Subscribe to events: "drift" | "patch" | "error"
     */
    on(event: string, callback: Listener): void;
    /**
     * Unsubscribe from events
     */
    off(event: string, callback: Listener): void;
    /**
     * Rollback a previously applied patch (marks it as rolled back)
     */
    rollback(patchId: string): Promise<void>;
    /**
     * Get the current baseline schema for an endpoint
     */
    getBaseline(endpoint: string): SchemaField[] | null;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        totalHits: number;
    };
};
export {};
