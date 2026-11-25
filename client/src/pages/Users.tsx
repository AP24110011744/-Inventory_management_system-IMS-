import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ROLE_LABEL, useAuth, type Role } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "./InventoryApp";

export default function UsersPage() {
  const { user: me } = useAuth(); const utils = trpc.useUtils(); const users = trpc.users.list.useQuery();
  const update = trpc.users.update.useMutation({ onSuccess: () => { toast.success("User updated"); utils.users.list.invalidate(); }, onError: e => toast.error(e.message) });
  return <AppShell><section className="page-content"><Card className="table-card">
    <CardHeader className="table-card-header"><div><CardTitle>Team members</CardTitle><p><strong>Admin</strong> manages everything · <strong>Manager</strong> edits products, categories and stock · <strong>Staff</strong> views data and makes sales.</p></div><Button variant="ghost" className="button-ghost" onClick={() => users.refetch()}><RefreshCw size={15} /> Refresh</Button></CardHeader>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last sign-in</th></tr></thead><tbody>{(users.data ?? []).map(u => { const self = u.id === me?.id; return <tr key={u.id}>
      <td><strong>{u.name ?? "—"}</strong>{self && <span className="you-tag">You</span>}</td><td>{u.email ?? "—"}</td>
      <td><select className="select-field role-select" value={u.role} disabled={self || update.isPending} onChange={e => update.mutate({ id: u.id, role: e.target.value as Role })}>{(Object.keys(ROLE_LABEL) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></td>
      <td><button className={`status-pill ${u.isActive ? "status-good" : "status-low"} pill-button`} disabled={self || update.isPending} onClick={() => update.mutate({ id: u.id, isActive: !u.isActive })} title={self ? "You cannot deactivate yourself" : u.isActive ? "Click to deactivate" : "Click to reactivate"}><span className="status-dot" />{u.isActive ? "Active" : "Deactivated"}</button></td>
      <td>{new Date(u.lastSignedIn).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td></tr>; })}</tbody></table></div>
  </Card></section></AppShell>;
}
