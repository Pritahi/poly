import { PatchOperation } from "./types";
export declare function applyPatches(data: unknown, patches: PatchOperation[]): unknown;
export declare function validatePatch(data: unknown, patches: PatchOperation[], expectedPaths: string[]): boolean;
