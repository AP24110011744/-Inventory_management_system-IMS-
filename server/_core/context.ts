import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { readSessionToken, verifySession } from "../auth";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  try {
    const uid = await verifySession(readSessionToken(opts.req));
    const found = uid ? await getUserById(uid) : undefined;
    user = found && found.isActive ? found : null;
  } catch {
    user = null; // authentication is optional for public procedures
  }
  return { req: opts.req, res: opts.res, user };
}
