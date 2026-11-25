import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, Boxes, CheckCircle2, ChevronRight, Database, FileText, IndianRupee,
  LayoutDashboard, Menu, Package, Pencil, Plus, Receipt, RefreshCw, Search, Settings2,
  ShoppingCart, Tags, Trash2, TrendingUp, UserRound, Warehouse, X, ArrowDownLeft, ArrowUpRight, History, LogOut, Users, ShieldCheck,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { ROLE_LABEL, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const navItems = [
  { label: "Inventory Management", path: "/inventory-management", icon: LayoutDashboard },
  { label: "Administration", path: "/administration", icon: Settings2 },
  { label: "Warehouse", path: "/warehouse", icon: Warehouse },
  { label: "Products", path: "/products", icon: Package },
  { label: "Categories", path: "/categories", icon: Tags },
  { label: "POS / Invoice", path: "/pos", icon: Receipt },
  { label: "Stock Movements", path: "/movements", icon: History },
  { label: "Users", path: "/users", icon: Users, adminOnly: true },
] as { label: string; path: string; icon: typeof Boxes; adminOnly?: boolean }[];
const pageMeta: Record<string, { title: string; eyebrow: string; description: string }> = {
  "/inventory-management": { title: "Inventory Management", eyebrow: "OPERATIONS OVERVIEW", description: "Keep every unit accounted for." },
  "/administration": { title: "Administration", eyebrow: "SYSTEM CONTROL", description: "Configuration and environment details." },
  "/warehouse": { title: "Warehouse", eyebrow: "STOCK CONTROL", description: "Monitor stock health before it becomes a problem." },
  "/products": { title: "Products", eyebrow: "CATALOG MANAGEMENT", description: "Search, maintain and organize your inventory." },
  "/categories": { title: "Categories", eyebrow: "CATALOG STRUCTURE", description: "Keep product classification clean and useful." },
  "/pos": { title: "POS / Invoice", eyebrow: "SALES WORKSPACE", description: "Create a clean invoice and update stock in one flow." },
  "/movements": { title: "Stock Movements", eyebrow: "AUDIT TRAIL", description: "Every stock in, out and adjustment — and who made it." },
  "/users": { title: "Users", eyebrow: "ACCESS CONTROL", description: "Manage who can sign in and what they can do." },
  "/profile": { title: "My Profile", eyebrow: "ACCOUNT", description: "Update your details and password." },
};

type Product = { id: number; sku: string; name: string; categoryId: number; category: string; supplier: string; quantity: number; reorderLevel: number; unitPrice: number; status: string };
type Category = { id: number; name: string };

function useRefresh() {
  const utils = trpc.useUtils();
  return () => Promise.all([
    utils.inventory.dashboard.invalidate(), utils.inventory.warehouse.invalidate(),
    utils.inventory.products.invalidate(), utils.inventory.categories.invalidate(), utils.inventory.insights.invalidate(), utils.inventory.movements.invalidate(),
  ]);
}

export function StatusPill({ status }: { status: string }) {
  const low = status === "LOW STOCK";
  return <span className={`status-pill ${low ? "status-low" : "status-good"}`}><span className="status-dot" />{low ? "Low stock" : "In stock"}</span>;
}

export function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Boxes; tone: "indigo" | "amber" | "green" | "blue" }) {
  return <Card className={`stat-card stat-${tone}`}><CardContent className="p-5"><div className="stat-icon"><Icon size={18} /></div><p className="stat-label">{label}</p><p className="stat-value">{value}</p><div className="stat-rule" /></CardContent></Card>;
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <div className="search-field"><Search size={16} /><Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><Boxes size={24} /><p className="font-semibold">{title}</p><p>{description}</p></div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const canonicalLocation = location === "/" ? "/inventory-management" : location;
  const meta = pageMeta[canonicalLocation] ?? pageMeta["/inventory-management"];
  const Sidebar = () => <aside className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
    <div className="brand-lockup"><div className="brand-mark">✦</div><div><div className="brand-name">Inventory Management</div><div className="brand-sub">INVENTORY CONTROL</div></div><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
    <nav className="nav-stack">{navItems.filter(item => !item.adminOnly || isAdmin).map(item => { const Icon = item.icon; const active = canonicalLocation === item.path; return <button key={item.path} className={`nav-item ${active ? "active" : ""}`} onClick={() => { navigate(item.path); setMobileOpen(false); }}><Icon size={17} /><span>{item.label}</span>{active && <ChevronRight className="nav-chevron" size={15} />}</button>; })}</nav>
    <div className="sidebar-bottom"><div className="online-dot" /> <span>MySQL workspace online</span></div><button className="nav-item logout-item" onClick={() => logout()}><LogOut size={17} /><span>Sign out</span></button>
  </aside>;
  return <div className="app-frame"><Sidebar />{mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <main className="main-canvas"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div><p className="eyebrow">{meta.eyebrow}</p><h1>{meta.title}</h1><p className="page-description">{meta.description}</p></div><button className="topbar-user" onClick={() => navigate("/profile")} title="My profile"><div className="avatar">{(user?.name ?? user?.email ?? "?").trim().charAt(0).toUpperCase()}</div><div><strong>{user?.name ?? user?.email}</strong><span>{user ? ROLE_LABEL[user.role] : ""}</span></div></button></header>{children}</main>
  </div>;
}

const CHART_COLORS = ["#4f5fd5", "#33c18b", "#f0a63a", "#5aa7e8", "#c6404e", "#8a6fd1"];
function ChartCard({ title, subtitle, children, className = "" }: { title: string; subtitle: string; children: React.ReactNode; className?: string }) {
  return <Card className={`chart-card ${className}`}><CardHeader><CardTitle>{title}</CardTitle><p>{subtitle}</p></CardHeader><CardContent>{children}</CardContent></Card>;
}
const shortDay = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });

function DashboardPage() {
  const { user } = useAuth();
  const stats = trpc.inventory.dashboard.useQuery(); const insights = trpc.inventory.insights.useQuery(); const [, navigate] = useLocation();
  const data = insights.data; const first = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours(); const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const weekRevenue = data?.salesTrend.reduce((n, d) => n + d.revenue, 0) ?? 0; const weekUnits = data?.salesTrend.reduce((n, d) => n + d.units, 0) ?? 0;
  return <AppShell><section className="page-content">
    <div className="welcome-banner"><div><p className="eyebrow">{greeting.toUpperCase()}</p><h2>{greeting}, {first}.</h2><p>{stats.data?.lowStock ? `${stats.data.lowStock} product${stats.data.lowStock === 1 ? " needs" : "s need"} restocking.` : "All products are comfortably stocked."}</p></div><Button className="button-primary" onClick={() => navigate("/pos")}><Receipt size={16} /> New invoice</Button></div>
    <div className="stats-grid stats-grid-4"><StatCard label="Total products" value={stats.data ? String(stats.data.totalProducts).padStart(2, "0") : "—"} icon={Package} tone="indigo" /><StatCard label="Low-stock alerts" value={stats.data ? String(stats.data.lowStock).padStart(2, "0") : "—"} icon={AlertTriangle} tone="amber" /><StatCard label="Inventory value" value={stats.data ? currency.format(stats.data.inventoryValue) : "—"} icon={IndianRupee} tone="green" /><StatCard label="Sales · last 7 days" value={data ? currency.format(weekRevenue) : "—"} icon={TrendingUp} tone="blue" /></div>
    <div className="chart-grid">
      <ChartCard title="Sales trend" subtitle={`${weekUnits} units sold in the last 7 days (at current prices)`} className="chart-wide"><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data?.salesTrend ?? []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f5fd5" stopOpacity={0.28} /><stop offset="100%" stopColor="#4f5fd5" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" vertical={false} /><XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 11, fill: "#71809c" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#71809c" }} axisLine={false} tickLine={false} tickFormatter={v => (v >= 1000 ? `${v / 1000}k` : v)} /><ChartTooltip formatter={(v: number) => [currency.format(v), "Revenue"]} labelFormatter={shortDay} /><Area type="monotone" dataKey="revenue" stroke="#4f5fd5" strokeWidth={2.5} fill="url(#rev)" /></AreaChart></ResponsiveContainer></div></ChartCard>
      <ChartCard title="Stock value by category" subtitle="Where your inventory money sits"><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={(data?.categoryBreakdown ?? []).filter(c => c.value > 0)} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>{(data?.categoryBreakdown ?? []).filter(c => c.value > 0).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><ChartTooltip formatter={(v: number) => currency.format(v)} /></PieChart></ResponsiveContainer></div><div className="chart-legend">{(data?.categoryBreakdown ?? []).filter(c => c.value > 0).map((c, i) => <span key={c.name}><i style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{c.name}</span>)}</div></ChartCard>
    </div>
    <div className="chart-grid">
      <ChartCard title="Units per category" subtitle="Current stock on hand"><div className="chart-box chart-short"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.categoryBreakdown ?? []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e6ecf5" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71809c" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#71809c" }} axisLine={false} tickLine={false} /><ChartTooltip /><Bar dataKey="units" name="Units" fill="#5aa7e8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></ChartCard>
      <Card className="chart-card"><CardHeader><CardTitle>Needs restocking</CardTitle><p>Lowest stock first</p></CardHeader><CardContent>{data?.lowStockItems.length ? <ul className="mini-list">{data.lowStockItems.map(p => <li key={p.id}><div><strong>{p.name}</strong><span>{p.sku}</span></div><span className="status-pill status-low"><span className="status-dot" />{p.quantity} / {p.reorderLevel}</span></li>)}</ul> : <div className="mini-empty"><CheckCircle2 size={18} /> Nothing below its reorder level.</div>}</CardContent></Card>
      <Card className="chart-card"><CardHeader><CardTitle>Recent activity</CardTitle><p>Latest stock movements</p></CardHeader><CardContent>{data?.recentMovements.length ? <ul className="mini-list">{data.recentMovements.map(m => <li key={m.id}><div><strong>{m.product}</strong><span>{m.user ?? "System"} · {m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span></div><MovementBadge type={m.type} quantity={m.quantity} /></li>)}</ul> : <div className="mini-empty"><History size={18} /> No movements yet.</div>}</CardContent></Card>
    </div>
  </section></AppShell>;
}

export function MovementBadge({ type, quantity }: { type: "IN" | "OUT" | "ADJUSTMENT"; quantity: number }) {
  const cfg = { IN: { cls: "mv-in", icon: <ArrowDownLeft size={13} />, sign: "+" }, OUT: { cls: "mv-out", icon: <ArrowUpRight size={13} />, sign: "−" }, ADJUSTMENT: { cls: "mv-adj", icon: <RefreshCw size={12} />, sign: "±" } }[type];
  return <span className={`mv-badge ${cfg.cls}`}>{cfg.icon}{cfg.sign}{quantity}</span>;
}

function ProductTable({ products, compact = false }: { products: Product[]; compact?: boolean }) {
  if (!products.length) return <EmptyState title="No products found" description="Add a product or adjust your search." />;
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>SKU</th><th>Product</th><th>Category</th><th>Supplier</th><th className="numeric">Stock</th><th className="numeric">Reorder</th>{!compact && <th className="numeric">Price</th>}<th>Status</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td className="mono">{p.sku}</td><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{p.supplier}</td><td className="numeric">{p.quantity}</td><td className="numeric">{p.reorderLevel}</td>{!compact && <td className="numeric price">{currency.format(p.unitPrice)}</td>}<td><StatusPill status={p.status} /></td></tr>)}</tbody></table></div>;
}

function AdministrationPage() { const { user } = useAuth(); return <AppShell><section className="page-content"><div className="admin-hero"><div className="admin-hero-icon"><Settings2 size={22} /></div><div><p className="eyebrow">INVENTORY MANAGEMENT ENVIRONMENT</p><h2>Everything in one place.</h2><p>Review the application context and database workspace powering your inventory operations.</p></div></div><div className="admin-grid"><InfoCard icon={Package} label="Application" value="Inventory Management" /><InfoCard icon={FileText} label="Version" value="Web edition 1.0.0" /><InfoCard icon={Settings2} label="Platform" value="React + Express + tRPC" /><InfoCard icon={Database} label="Database" value="MySQL • inventory_db" /><InfoCard icon={Boxes} label="Data access" value="Drizzle ORM / JDBC-compatible schema" /><InfoCard icon={UserRound} label="Current user" value={`${user?.name ?? "—"} · ${user ? ROLE_LABEL[user.role] : ""}`} /><InfoCard icon={ShieldCheck} label="Authentication" value="Email + password · signed session cookie" /></div></section></AppShell>; }
function InfoCard({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) { return <Card className="info-card"><CardContent><div className="info-icon"><Icon size={18} /></div><div><p>{label}</p><strong>{value}</strong></div></CardContent></Card>; }

function WarehousePage() { const warehouse = trpc.inventory.warehouse.useQuery(); return <AppShell><section className="page-content"><div className="stats-grid"><StatCard label="Total stock units" value={warehouse.data ? String(warehouse.data.totalUnits) : "—"} icon={Boxes} tone="blue" /><StatCard label="Available products" value={warehouse.data ? String(warehouse.data.totalProducts) : "—"} icon={Package} tone="green" /><StatCard label="Reorder required" value={warehouse.data ? String(warehouse.data.lowStock) : "—"} icon={AlertTriangle} tone="amber" /></div><Card className="table-card"><CardHeader className="table-card-header"><div><CardTitle>Warehouse stock overview</CardTitle><p>Every product, current quantity and reorder threshold.</p></div><div className="live-label"><span className="online-dot" /> Live from MySQL</div></CardHeader><ProductTable products={warehouse.data?.products ?? []} compact /></Card></section></AppShell>; }

function ProductDialog({ product, open, onOpenChange, onSaved }: { product?: Product; open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const categories = trpc.inventory.categories.useQuery({ search: "" }); const save = trpc.inventory.saveProduct.useMutation();
  const [form, setForm] = useState({ sku: product?.sku ?? "", name: product?.name ?? "", category: product?.category ?? "", supplier: product?.supplier === "—" ? "" : product?.supplier ?? "", quantity: String(product?.quantity ?? 0), reorderLevel: String(product?.reorderLevel ?? 10), unitPrice: String(product?.unitPrice ?? "") });
  useEffect(() => { setForm({ sku: product?.sku ?? "", name: product?.name ?? "", category: product?.category ?? "", supplier: product?.supplier === "—" ? "" : product?.supplier ?? "", quantity: String(product?.quantity ?? 0), reorderLevel: String(product?.reorderLevel ?? 10), unitPrice: String(product?.unitPrice ?? "") }); }, [product, open]);
  const update = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = () => { const input = { id: product?.id, sku: form.sku, name: form.name, category: form.category, supplier: form.supplier, quantity: Number(form.quantity), reorderLevel: Number(form.reorderLevel), unitPrice: Number(form.unitPrice) }; save.mutate(input, { onSuccess: () => { toast.success(product ? "Product updated" : "Product added"); onOpenChange(false); onSaved(); }, onError: e => toast.error(e.message) }); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="dialog-content"><DialogHeader><DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle><DialogDescription>Keep catalog details accurate so stock signals stay reliable.</DialogDescription></DialogHeader><div className="form-grid"><Field label="SKU" value={form.sku} onChange={v => update("sku",v)} /><Field label="Product name" value={form.name} onChange={v => update("name",v)} /><div className="field"><Label>Category</Label><select value={form.category} onChange={e => update("category",e.target.value)} className="select-field"><option value="">Select category</option>{categories.data?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div><Field label="Supplier" value={form.supplier} onChange={v => update("supplier",v)} /><Field label="Quantity" type="number" value={form.quantity} onChange={v => update("quantity",v)} /><Field label="Reorder level" type="number" value={form.reorderLevel} onChange={v => update("reorderLevel",v)} /><Field label="Unit price (₹)" type="number" value={form.unitPrice} onChange={v => update("unitPrice",v)} /></div><DialogFooter><Button variant="outline" className="button-outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="button-primary" onClick={submit} disabled={save.isPending}>{save.isPending ? "Saving…" : product ? "Save changes" : "Add product"}</Button></DialogFooter></DialogContent></Dialog>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) { return <div className="field"><Label>{label}</Label><Input type={type} value={value} onChange={e => onChange(e.target.value)} /></div>; }

function ProductsPage() {
  const { isManager } = useAuth(); const [search, setSearch] = useState(""); const [dialog, setDialog] = useState(false); const [editing, setEditing] = useState<Product>();
  const products = trpc.inventory.products.useQuery({ search }); const remove = trpc.inventory.deleteProduct.useMutation(); const refresh = useRefresh();
  const openAdd = () => { setEditing(undefined); setDialog(true); }; const openEdit = (p: Product) => { setEditing(p); setDialog(true); };
  const deleteProduct = (p: Product) => { if (!window.confirm(`Delete ${p.name}?`)) return; remove.mutate({ id: p.id }, { onSuccess: () => { toast.success("Product deleted"); refresh(); }, onError: e => toast.error(e.message) }); };
  return <AppShell><section className="page-content"><Card className="table-card"><CardHeader className="table-card-header"><div><CardTitle>Products</CardTitle><p>Manage the live product catalog and stock thresholds.</p></div><div className="toolbar"><SearchField value={search} onChange={setSearch} placeholder="Search SKU, product or category" />{isManager && <Button className="button-primary" onClick={openAdd}><Plus size={16} /> Add product</Button>}</div></CardHeader><div className="table-actions"><span>{products.data?.length ?? 0} products shown</span><Button variant="ghost" className="button-ghost" onClick={() => products.refetch()}><RefreshCw size={15} /> Refresh</Button></div><div className="table-scroll"><table className="data-table"><thead><tr><th>SKU</th><th>Product name</th><th>Category</th><th>Supplier</th><th className="numeric">Stock</th><th className="numeric">Reorder</th><th className="numeric">Price</th><th>Status</th>{isManager && <th className="actions-col">Actions</th>}</tr></thead><tbody>{(products.data ?? []).map(p => <tr key={p.id}><td className="mono">{p.sku}</td><td><strong>{p.name}</strong></td><td>{p.category}</td><td>{p.supplier}</td><td className="numeric">{p.quantity}</td><td className="numeric">{p.reorderLevel}</td><td className="numeric price">{currency.format(p.unitPrice)}</td><td><StatusPill status={p.status} /></td>{isManager && <td className="row-actions"><button className="icon-action" onClick={() => openEdit(p)} title="Edit"><Pencil size={15} /></button><button className="icon-action danger" onClick={() => deleteProduct(p)} title="Delete"><Trash2 size={15} /></button></td>}</tr>)}</tbody></table>{!products.data?.length && <EmptyState title="No matching products" description="Try a different search or add a new product." />}</div></Card></section><ProductDialog product={editing} open={dialog} onOpenChange={setDialog} onSaved={refresh} /></AppShell>;
}

function CategoriesPage() {
  const { isManager } = useAuth(); const [search, setSearch] = useState(""); const [name, setName] = useState(""); const [editing, setEditing] = useState<Category>();
  const categories = trpc.inventory.categories.useQuery({ search }); const add = trpc.inventory.addCategory.useMutation(); const update = trpc.inventory.updateCategory.useMutation(); const remove = trpc.inventory.deleteCategory.useMutation();
  const submit = () => { if (!name.trim()) { toast.error("Category name is required."); return; } const callbacks = { onSuccess: () => { toast.success(editing ? "Category updated" : "Category added"); setName(""); setEditing(undefined); categories.refetch(); }, onError: (e: { message: string }) => toast.error(e.message) }; if (editing) update.mutate({ id: editing.id, name }, callbacks); else add.mutate({ name }, callbacks); };
  const startEdit = (c: Category) => { setEditing(c); setName(c.name); }; const removeCategory = (c: Category) => { if (!window.confirm(`Delete ${c.name}?`)) return; remove.mutate({ id: c.id }, { onSuccess: () => { toast.success("Category deleted"); categories.refetch(); }, onError: e => toast.error(e.message) }); };
  return <AppShell><section className="page-content"><Card className="table-card"><CardHeader className="table-card-header category-header"><div><CardTitle>Category management</CardTitle><p>Structure the catalog so products are easy to find.</p></div><SearchField value={search} onChange={setSearch} placeholder="Search categories" /></CardHeader>{isManager && <div className="category-toolbar"><Field label={editing ? "Edit category" : "New category"} value={name} onChange={setName} /><Button className="button-primary" onClick={submit} disabled={add.isPending || update.isPending}>{editing ? <Pencil size={16} /> : <Plus size={16} />}{editing ? "Save category" : "Add category"}</Button>{editing && <Button variant="outline" className="button-outline" onClick={() => { setEditing(undefined); setName(""); }}>Cancel</Button>}<Button variant="ghost" className="button-ghost" onClick={() => categories.refetch()}><RefreshCw size={15} /> Refresh</Button></div>}<div className="table-scroll"><table className="data-table compact-table"><thead><tr><th className="numeric">#</th><th>Category name</th>{isManager && <th className="actions-col">Actions</th>}</tr></thead><tbody>{(categories.data ?? []).map((c, index) => <tr key={c.id}><td className="numeric muted-number">{index + 1}</td><td><strong>{c.name}</strong></td>{isManager && <td className="row-actions"><button className="icon-action" onClick={() => startEdit(c)} title="Edit"><Pencil size={15} /></button><button className="icon-action danger" onClick={() => removeCategory(c)} title="Delete"><Trash2 size={15} /></button></td>}</tr>)}</tbody></table>{!categories.data?.length && <EmptyState title="No categories found" description="Add your first category above." />}</div></Card></section></AppShell>;
}

function PosPage() {
  const products = trpc.inventory.products.useQuery({ search: "" }); const [productId, setProductId] = useState(0); const [quantity, setQuantity] = useState("1"); const [invoice, setInvoice] = useState<{ sku: string; name: string; quantity: number; unitPrice: number; total: number }>(); const sale = trpc.inventory.createSale.useMutation(); const refresh = useRefresh();
  const selected = products.data?.find(p => p.id === productId); const qty = Number(quantity); const total = selected && qty > 0 ? selected.unitPrice * qty : 0;
  const calculate = () => { if (!selected) return toast.error("Select a product first."); if (!Number.isInteger(qty) || qty <= 0) return toast.error("Enter a positive whole-number quantity."); if (qty > selected.quantity) return toast.error(`Available stock: ${selected.quantity}.`); toast.success("Total calculated"); };
  const generate = () => { if (!selected) return toast.error("Select a product first."); if (!Number.isInteger(qty) || qty <= 0) return toast.error("Enter a positive whole-number quantity."); if (qty > selected.quantity) return toast.error(`Available stock: ${selected.quantity}.`); sale.mutate({ productId: selected.id, quantity: qty }, { onSuccess: result => { setInvoice(result); toast.success("Invoice generated and stock updated"); refresh(); }, onError: e => toast.error(e.message) }); };
  return <AppShell><section className="page-content"><div className="pos-layout"><Card className="pos-card"><CardHeader><div className="insight-kicker"><ShoppingCart size={15} /> SALES WORKSPACE</div><CardTitle>Create invoice</CardTitle><p>Select a product and quantity. Stock is validated before deduction.</p></CardHeader><CardContent><div className="pos-form"><div className="field"><Label>Product</Label><select className="select-field" value={productId} onChange={e => setProductId(Number(e.target.value))}><option value={0}>Select a product</option>{products.data?.map(p => <option key={p.id} value={p.id}>{p.sku} · {p.name} · {currency.format(p.unitPrice)}</option>)}</select></div><div className="field"><Label>Quantity</Label><Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></div><div className="availability">{selected ? <><span className="online-dot" /> {selected.quantity} units available</> : "Choose a product to see availability"}</div><div className="pos-total"><span>Calculated total</span><strong>{currency.format(total)}</strong></div><div className="pos-actions"><Button variant="outline" className="button-outline" onClick={calculate}>Calculate total</Button><Button className="button-primary" onClick={generate} disabled={sale.isPending}><Receipt size={16} />{sale.isPending ? "Generating…" : "Generate invoice"}</Button></div></div></CardContent></Card>{invoice ? <Card className="invoice-card"><CardHeader><div className="invoice-top"><div className="invoice-mark">✦</div><div><CardTitle>Invoice generated</CardTitle><p>{new Date().toLocaleString("en-IN")}</p></div><CheckCircle2 className="success-icon" size={23} /></div></CardHeader><CardContent><div className="invoice-lines"><div><span>SKU</span><strong>{invoice.sku}</strong></div><div><span>Product</span><strong>{invoice.name}</strong></div><div><span>Quantity</span><strong>{invoice.quantity}</strong></div><div><span>Unit price</span><strong>{currency.format(invoice.unitPrice)}</strong></div></div><div className="invoice-total"><span>Total</span><strong>{currency.format(invoice.total)}</strong></div><div className="invoice-success"><CheckCircle2 size={16} /> Stock movement recorded successfully.</div></CardContent></Card> : <Card className="invoice-placeholder"><CardContent><FileText size={28} /><h3>Your invoice will appear here</h3><p>Generate a sale to create a clear transaction summary and update inventory.</p></CardContent></Card>}</div></section></AppShell>;
}

export default function InventoryApp() { const [location] = useLocation(); switch(location) { case "/administration": return <AdministrationPage />; case "/warehouse": return <WarehousePage />; case "/products": return <ProductsPage />; case "/categories": return <CategoriesPage />; case "/pos": return <PosPage />; case "/inventory-management": return <DashboardPage />; default: return <DashboardPage />; } }
