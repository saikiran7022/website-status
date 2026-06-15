/**
 * Compatibility facade. The canonical auth implementation lives in
 * `@/lib/auth/index` (and `./auth/password`, `./auth/session`). This file
 * re-exports it so existing `import ... from "@/lib/auth"` paths keep working.
 */
export * from "./auth/index";
