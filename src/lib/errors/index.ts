// Server-side
export { AppError, isAppError } from "./app-error";
export { ERROR_CATALOG, type ErrorCode, type ErrorDef } from "./codes";
export { withErrorHandler } from "./api-handler";
export { logger } from "./logger";
export { requireAuth, requireAdmin } from "./auth-helpers";

// Client-side (re-export separado para tree-shaking)
// Usar: import { safeFetch, handleApiResponse } from "@/lib/errors/client"
