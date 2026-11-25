import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { BarChart3, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, UserRound, Boxes } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return <div className="auth-shell">
    <aside className="auth-aside">
      <div className="brand-lockup auth-brand"><div className="brand-mark">✦</div><div><div className="brand-name">Inventory Management</div><div className="brand-sub">INVENTORY CONTROL</div></div></div>
      <div className="auth-pitch">
        <h2>Every unit accounted for.</h2>
        <p>Track stock, run invoices and keep your team on the same page — with access that matches each person's role.</p>
        <ul>
          <li><BarChart3 size={17} /><span>Live dashboard with sales and stock insights</span></li>
          <li><Boxes size={17} /><span>Full stock movement history, per user</span></li>
          <li><ShieldCheck size={17} /><span>Role-based access: admin, manager and staff</span></li>
        </ul>
      </div>
      <p className="auth-copy">© {new Date().getFullYear()} Inventory Management</p>
    </aside>
    <main className="auth-main"><div className="auth-card">
      <p className="eyebrow">WELCOME</p><h1>{title}</h1><p className="auth-sub">{subtitle}</p>
      {children}
      <p className="auth-footer">{footer}</p>
    </div></main>
  </div>;
}

function IconInput({ icon: Icon, label, id, type = "text", value, onChange, placeholder, autoComplete, trailing }: { icon: typeof Mail; label: string; id: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; trailing?: ReactNode }) {
  return <div className="field"><Label htmlFor={id}>{label}</Label><div className="auth-input"><Icon size={16} /><Input style={{ paddingLeft: 40, paddingRight: trailing ? 40 : undefined }} id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required />{trailing}</div></div>;
}

function PasswordInput({ id, label, value, onChange, autoComplete }: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return <IconInput icon={Lock} label={label} id={id} type={show ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} placeholder="••••••••"
    trailing={<button type="button" className="auth-eye" onClick={() => setShow(s => !s)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />;
}

export function passwordScore(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) && /[A-Z]/.test(pw)) score++;
  return score; // 0-4
}

export function LoginPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const login = trpc.auth.login.useMutation({
    onSuccess: async user => { utils.auth.me.setData(undefined, user); await utils.invalidate(); toast.success(`Welcome back, ${user.name?.split(" ")[0] ?? "there"}`); navigate("/inventory-management"); },
    onError: e => toast.error(e.message),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); login.mutate({ email, password }); };
  return <AuthLayout title="Sign in" subtitle="Enter your credentials to open your workspace." footer={<>New here? <Link href="/signup">Create an account</Link></>}>
    <form onSubmit={submit} className="auth-form">
      <IconInput icon={Mail} label="Email" id="email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
      <PasswordInput id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
      <Button type="submit" className="button-primary auth-submit" disabled={login.isPending}>{login.isPending ? <Loader2 className="animate-spin" size={16} /> : null}{login.isPending ? "Signing in…" : "Sign in"}</Button>
    </form>
  </AuthLayout>;
}

export function SignupPage() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const score = useMemo(() => passwordScore(password), [password]);
  const register = trpc.auth.register.useMutation({
    onSuccess: async user => { utils.auth.me.setData(undefined, user); await utils.invalidate(); toast.success(user.role === "admin" ? "Account created — you're the workspace administrator." : "Account created. Welcome aboard!"); navigate("/inventory-management"); },
    onError: e => toast.error(e.message),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match.");
    register.mutate({ name, email, password });
  };
  const labels = ["Too weak", "Weak", "Okay", "Good", "Strong"];
  return <AuthLayout title="Create your account" subtitle="The first account created becomes the administrator." footer={<>Already have an account? <Link href="/login">Sign in</Link></>}>
    <form onSubmit={submit} className="auth-form">
      <IconInput icon={UserRound} label="Full name" id="name" value={name} onChange={setName} placeholder="Asha Verma" autoComplete="name" />
      <IconInput icon={Mail} label="Email" id="email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" />
      <PasswordInput id="password" label="Password" value={password} onChange={setPassword} autoComplete="new-password" />
      {password && <div className="strength"><div className="strength-bars">{[1, 2, 3, 4].map(i => <span key={i} className={i <= score ? `on s${score}` : ""} />)}</div><span>{labels[score]}</span></div>}
      <p className="hint">At least 8 characters, with a letter and a number.</p>
      <PasswordInput id="confirm" label="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <Button type="submit" className="button-primary auth-submit" disabled={register.isPending}>{register.isPending ? <Loader2 className="animate-spin" size={16} /> : null}{register.isPending ? "Creating account…" : "Create account"}</Button>
    </form>
  </AuthLayout>;
}
