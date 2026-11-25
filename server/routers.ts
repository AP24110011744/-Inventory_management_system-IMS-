import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { adminProcedure, managerProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { SESSION_TTL_MS, checkRateLimit, clearRateLimit, hashPassword, signSession, validatePasswordStrength, verifyPassword } from "./auth";
import {
  adjustStock, createCategory, createLocalUser, createSale, dashboardInsights, dashboardStats, deleteCategory, deleteProduct, getProduct,
  getUserByEmail, getUserById, listCategories, listMovements, listProducts, listUsers, saveProduct, toPublicUser, touchLastSignedIn,
  updateCategory, updateUserAccess, updateUserProfile, warehouseStats,
} from "./db";

const productInput = z.object({ id: z.number().optional(), sku: z.string(), name: z.string(), category: z.string(), supplier: z.string().optional(), quantity: z.number().int(), reorderLevel: z.number().int(), unitPrice: z.number() });
const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(320);
const password = z.string().min(1, "Password is required.").max(128);
const roleEnum = z.enum(["user", "manager", "admin"]);

const clientKey = (req: { ip?: string; socket?: { remoteAddress?: string } }) => req.ip ?? req.socket?.remoteAddress ?? "unknown";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => (ctx.user ? toPublicUser(ctx.user) : null)),
    register: publicProcedure
      .input(z.object({ name: z.string().trim().min(2, "Enter your full name.").max(80), email, password }))
      .mutation(async ({ input, ctx }) => {
        checkRateLimit(`register:${clientKey(ctx.req)}`, 10);
        const weak = validatePasswordStrength(input.password);
        if (weak) throw new TRPCError({ code: "BAD_REQUEST", message: weak });
        const user = await createLocalUser({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password) });
        ctx.res.cookie(COOKIE_NAME, await signSession(user.id), { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_TTL_MS });
        return toPublicUser(user);
      }),
    login: publicProcedure
      .input(z.object({ email, password }))
      .mutation(async ({ input, ctx }) => {
        const key = `login:${clientKey(ctx.req)}:${input.email}`;
        checkRateLimit(key);
        const user = await getUserByEmail(input.email);
        const ok = await verifyPassword(input.password, user?.passwordHash); // always hash-compare to keep timing similar
        if (!user || !ok) throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect email or password." });
        if (!user.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "This account has been deactivated. Contact an administrator." });
        clearRateLimit(key);
        await touchLastSignedIn(user.id);
        ctx.res.cookie(COOKIE_NAME, await signSession(user.id), { ...getSessionCookieOptions(ctx.req), maxAge: SESSION_TTL_MS });
        return toPublicUser(user);
      }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
    updateProfile: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(80) })).mutation(async ({ input, ctx }) => { await updateUserProfile(ctx.user.id, { name: input.name }); return { success: true }; }),
    changePassword: protectedProcedure
      .input(z.object({ currentPassword: password, newPassword: password }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        if (!(await verifyPassword(input.currentPassword, user?.passwordHash))) throw new TRPCError({ code: "BAD_REQUEST", message: "Current password is incorrect." });
        const weak = validatePasswordStrength(input.newPassword);
        if (weak) throw new TRPCError({ code: "BAD_REQUEST", message: weak });
        await updateUserProfile(ctx.user.id, { passwordHash: await hashPassword(input.newPassword) });
        return { success: true };
      }),
  }),
  users: router({
    list: adminProcedure.query(() => listUsers()),
    update: adminProcedure
      .input(z.object({ id: z.number(), role: roleEnum.optional(), isActive: z.boolean().optional() }))
      .mutation(({ input, ctx }) => updateUserAccess(ctx.user.id, input.id, { role: input.role, isActive: input.isActive })),
  }),
  inventory: router({
    dashboard: protectedProcedure.query(() => dashboardStats()),
    insights: protectedProcedure.query(() => dashboardInsights()),
    warehouse: protectedProcedure.query(() => warehouseStats()),
    products: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listProducts(input?.search ?? "")),
    product: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => getProduct(input.id)),
    saveProduct: managerProcedure.input(productInput).mutation(({ input }) => saveProduct(input)),
    deleteProduct: managerProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteProduct(input.id)),
    categories: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(({ input }) => listCategories(input?.search ?? "")),
    addCategory: managerProcedure.input(z.object({ name: z.string() })).mutation(({ input }) => createCategory(input.name)),
    updateCategory: managerProcedure.input(z.object({ id: z.number(), name: z.string() })).mutation(({ input }) => updateCategory(input.id, input.name)),
    deleteCategory: managerProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteCategory(input.id)),
    createSale: protectedProcedure.input(z.object({ productId: z.number(), quantity: z.number().int() })).mutation(({ input, ctx }) => createSale(input, ctx.user.id)),
    movements: protectedProcedure.input(z.object({ type: z.enum(["IN", "OUT", "ADJUSTMENT"]).optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => listMovements(input ?? {})),
    adjustStock: managerProcedure.input(z.object({ productId: z.number(), type: z.enum(["IN", "OUT", "ADJUSTMENT"]), quantity: z.number().int(), note: z.string().max(255).optional() })).mutation(({ input, ctx }) => adjustStock(input, ctx.user.id)),
  }),
});
export type AppRouter = typeof appRouter;
