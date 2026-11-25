import { describe, expect, it, vi } from "vitest";
import { hashPassword, signSession, validatePasswordStrength, verifyPassword, verifySession, checkRateLimit } from "./auth";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const ctxFor = (role?: "user" | "manager" | "admin"): TrpcContext => ({
  user: role ? { id: 1, openId: "local:x", name: "T", email: "t@example.com", loginMethod: "password", passwordHash: null, role, isActive: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } : null,
  req: { protocol: "http", headers: {}, ip: "1.2.3.4" } as TrpcContext["req"],
  res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
});

describe("password hashing", () => {
  it("verifies the right password and rejects wrong or missing ones", async () => {
    const hash = await hashPassword("Correct horse 9");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("Correct horse 9", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await hashPassword("Correct horse 9")).not.toBe(hash); // unique salt
  });
  it("enforces password strength", () => {
    expect(validatePasswordStrength("short1")).toMatch(/8 characters/);
    expect(validatePasswordStrength("onlyletters")).toMatch(/letter and one number/);
    expect(validatePasswordStrength("goodpass123")).toBeNull();
  });
});

describe("sessions", () => {
  it("round-trips a user id and rejects tampered tokens", async () => {
    const token = await signSession(42);
    expect(await verifySession(token)).toBe(42);
    expect(await verifySession(token.slice(0, -2) + "xx")).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
  });
});

describe("rate limiting", () => {
  it("blocks after too many attempts", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("t-key", 3);
    expect(() => checkRateLimit("t-key", 3)).toThrow(/Too many attempts/);
  });
});

describe("authorization", () => {
  it("rejects anonymous access to inventory data", async () => {
    await expect(appRouter.createCaller(ctxFor()).inventory.products()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(await appRouter.createCaller(ctxFor()).auth.me()).toBeNull();
  });
  it("blocks staff from manager and admin actions", async () => {
    const staff = appRouter.createCaller(ctxFor("user"));
    await expect(staff.inventory.deleteProduct({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(staff.users.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks managers from user administration", async () => {
    await expect(appRouter.createCaller(ctxFor("manager")).users.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("validates registration input before touching the database", async () => {
    const anon = appRouter.createCaller(ctxFor());
    await expect(anon.auth.register({ name: "A", email: "bad", password: "x" })).rejects.toThrow();
    await expect(anon.auth.register({ name: "Valid Name", email: "v@example.com", password: "alllletters" })).rejects.toThrow(/letter and one number/);
  });
});
