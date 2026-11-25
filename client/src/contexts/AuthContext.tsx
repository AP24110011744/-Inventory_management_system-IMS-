import { createContext, useContext, type ReactNode } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "../../../server/routers";

export type Me = NonNullable<inferRouterOutputs<AppRouter>["auth"]["me"]>;
export type Role = Me["role"];

type AuthState = { user: Me | null; loading: boolean; isManager: boolean; isAdmin: boolean; logout: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export const ROLE_LABEL: Record<Role, string> = { admin: "Administrator", manager: "Manager", user: "Staff" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: true, staleTime: 60_000 });
  const logoutMutation = trpc.auth.logout.useMutation();
  const user = me.data ?? null;
  const logout = async () => {
    await logoutMutation.mutateAsync();
    utils.auth.me.setData(undefined, null);
    await utils.invalidate(); // drop any cached inventory data from the previous session
    window.location.assign("/login");
  };
  return <AuthContext.Provider value={{ user, loading: me.isLoading, isManager: user?.role === "admin" || user?.role === "manager", isAdmin: user?.role === "admin", logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
