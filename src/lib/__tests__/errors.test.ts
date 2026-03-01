import { describe, it, expect } from "vitest";
import { AppError, isAppError } from "../errors/app-error";
import { ERROR_CATALOG } from "../errors/codes";

describe("AppError", () => {
  it("should create with default message from catalog", () => {
    const error = new AppError("AUTH_NOT_AUTHENTICATED");
    expect(error.message).toBe("Faca login para continuar");
    expect(error.code).toBe("AUTH_NOT_AUTHENTICATED");
    expect(error.status).toBe(401);
  });

  it("should allow custom message", () => {
    const error = new AppError("VAL_MISSING_FIELDS", "Nome e obrigatorio");
    expect(error.message).toBe("Nome e obrigatorio");
    expect(error.code).toBe("VAL_MISSING_FIELDS");
    expect(error.status).toBe(400);
  });

  it("should include details", () => {
    const error = new AppError("RES_NOT_FOUND", undefined, { id: "123" });
    expect(error.details).toEqual({ id: "123" });
  });

  it("should serialize to JSON", () => {
    const error = new AppError("APPT_SLOT_TAKEN");
    const json = error.toJSON();
    expect(json.error.code).toBe("APPT_SLOT_TAKEN");
    expect(json.error.message).toBe("Este horario ja esta ocupado");
  });

  it("should be an instance of Error", () => {
    const error = new AppError("SYS_INTERNAL");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
  });
});

describe("isAppError", () => {
  it("should return true for AppError instances", () => {
    expect(isAppError(new AppError("SYS_INTERNAL"))).toBe(true);
  });

  it("should return false for regular errors", () => {
    expect(isAppError(new Error("test"))).toBe(false);
  });

  it("should return false for non-errors", () => {
    expect(isAppError("string")).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });
});

describe("ERROR_CATALOG", () => {
  it("should have valid HTTP status codes for all entries", () => {
    for (const [code, def] of Object.entries(ERROR_CATALOG)) {
      expect(def.status).toBeGreaterThanOrEqual(200);
      expect(def.status).toBeLessThan(600);
      expect(def.message).toBeTruthy();
    }
  });

  it("should have all expected error categories", () => {
    const codes = Object.keys(ERROR_CATALOG);
    expect(codes.some((c) => c.startsWith("AUTH_"))).toBe(true);
    expect(codes.some((c) => c.startsWith("VAL_"))).toBe(true);
    expect(codes.some((c) => c.startsWith("RES_"))).toBe(true);
    expect(codes.some((c) => c.startsWith("APPT_"))).toBe(true);
    expect(codes.some((c) => c.startsWith("SYS_"))).toBe(true);
    expect(codes.some((c) => c.startsWith("LOY_"))).toBe(true);
  });
});
