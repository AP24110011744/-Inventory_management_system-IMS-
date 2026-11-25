import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, ShieldCheck, CalendarDays } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ROLE_LABEL, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "./InventoryApp";

export default function ProfilePage() {
  const { user, logout } = useAuth(); const utils = trpc.useUtils();
  const [name, setName] = useState(user?.name ?? ""); useEffect(() => setName(user?.name ?? ""), [user?.name]);
  const [current, setCurrent] = useState(""); const [next, setNext] = useState(""); const [confirm, setConfirm] = useState("");
  const saveName = trpc.auth.updateProfile.useMutation({ onSuccess: () => { toast.success("Profile updated"); utils.auth.me.invalidate(); }, onError: e => toast.error(e.message) });
  const changePw = trpc.auth.changePassword.useMutation({ onSuccess: () => { toast.success("Password changed"); setCurrent(""); setNext(""); setConfirm(""); }, onError: e => toast.error(e.message) });
  const submitPw = (e: FormEvent) => { e.preventDefault(); if (next !== confirm) return toast.error("New passwords do not match."); changePw.mutate({ currentPassword: current, newPassword: next }); };
  if (!user) return null;
  return <AppShell><section className="page-content"><div className="profile-grid">
    <Card className="chart-card profile-summary"><CardContent>
      <div className="avatar avatar-lg">{(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}</div><h3>{user.name}</h3>
      <ul className="profile-facts"><li><Mail size={15} />{user.email}</li><li><ShieldCheck size={15} />{ROLE_LABEL[user.role]}</li><li><CalendarDays size={15} />Joined {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</li></ul>
      <Button variant="outline" className="button-outline" onClick={() => logout()}>Sign out</Button>
    </CardContent></Card>
    <div className="profile-forms">
      <Card className="chart-card"><CardHeader><CardTitle>Personal details</CardTitle></CardHeader><CardContent><form className="auth-form" onSubmit={e => { e.preventDefault(); saveName.mutate({ name }); }}><div className="field"><Label>Full name</Label><Input value={name} onChange={e => setName(e.target.value)} required minLength={2} /></div><div className="field"><Label>Email</Label><Input value={user.email ?? ""} disabled /></div><Button type="submit" className="button-primary" disabled={saveName.isPending || name.trim() === user.name}>Save changes</Button></form></CardContent></Card>
      <Card className="chart-card"><CardHeader><CardTitle>Change password</CardTitle></CardHeader><CardContent><form className="auth-form" onSubmit={submitPw}><div className="field"><Label>Current password</Label><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required /></div><div className="field"><Label>New password</Label><Input type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" required /></div><div className="field"><Label>Confirm new password</Label><Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required /></div><p className="hint">At least 8 characters, with a letter and a number.</p><Button type="submit" className="button-primary" disabled={changePw.isPending}>Update password</Button></form></CardContent></Card>
    </div>
  </div></section></AppShell>;
}
