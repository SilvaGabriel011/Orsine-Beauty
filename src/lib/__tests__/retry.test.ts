import { describe, it, expect, vi } from "vitest";
import { withRetry, isHttpRetryable } from "../retry";

describe("withRetry", () => {
  it("should return result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn, { maxAttempts: 3 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and succeed", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const result = await withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 10,
    });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should throw after max attempts", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    await expect(
      withRetry(fn, { maxAttempts: 3, initialDelayMs: 10 })
    ).rejects.toThrow("always fails");

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should not retry non-retryable errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("non-retryable"));

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        initialDelayMs: 10,
        isRetryable: () => false,
      })
    ).rejects.toThrow("non-retryable");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should call onRetry callback", async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");

    await withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 10,
      onRetry,
    });

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, 10);
  });

  it("should apply exponential backoff", async () => {
    const onRetry = vi.fn();
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("ok");

    await withRetry(fn, {
      maxAttempts: 4,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      onRetry,
    });

    // First retry: 100ms, second retry: 200ms
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1, 100);
    expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2, 200);
  });
});

describe("isHttpRetryable", () => {
  it("should return true for 500 errors", () => {
    expect(isHttpRetryable({ status: 500 })).toBe(true);
  });

  it("should return true for 502 errors", () => {
    expect(isHttpRetryable({ status: 502 })).toBe(true);
  });

  it("should return true for 429 errors", () => {
    expect(isHttpRetryable({ status: 429 })).toBe(true);
  });

  it("should return false for 400 errors", () => {
    expect(isHttpRetryable({ status: 400 })).toBe(false);
  });

  it("should return false for 404 errors", () => {
    expect(isHttpRetryable({ status: 404 })).toBe(false);
  });

  it("should return true for network errors", () => {
    expect(isHttpRetryable(new Error("fetch failed"))).toBe(true);
  });

  it("should return true for connection reset errors", () => {
    expect(isHttpRetryable(new Error("ECONNRESET"))).toBe(true);
  });

  it("should return true for unknown errors", () => {
    expect(isHttpRetryable(new Error("something"))).toBe(true);
  });
});
