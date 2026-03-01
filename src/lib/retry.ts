/**
 * Retry utility with exponential backoff for external service calls.
 *
 * Usage:
 *   const result = await withRetry(() => callExternalAPI(), { maxAttempts: 3 });
 */

interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms (default: 500) */
  initialDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay in ms (default: 5000) */
  maxDelayMs?: number;
  /** Function to determine if an error is retryable (default: always true) */
  isRetryable?: (error: unknown) => boolean;
  /** Called on each retry attempt (for logging) */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  maxDelayMs: 5000,
  isRetryable: () => true,
  onRetry: () => {},
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry and exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or non-retryable errors
      if (attempt >= opts.maxAttempts || !opts.isRetryable(error)) {
        throw error;
      }

      opts.onRetry(error, attempt, delay);

      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Helper: determine if an HTTP error is retryable.
 * Retries on 5xx, 429, and network errors.
 */
export function isHttpRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch failed") || error.message.includes("ECONNRESET")) {
      return true;
    }
  }

  // Check for HTTP status in error objects
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as { status: number }).status;
    return status >= 500 || status === 429;
  }

  return true; // Retry unknown errors by default
}
