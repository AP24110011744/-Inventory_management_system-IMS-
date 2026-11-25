import { useState } from "react";
import { toast } from "sonner";
import { Plus, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppShell, EmptyState, MovementBadge } from "./InventoryApp";

type MoveType = "IN" | "OUT" | "ADJUSTMENT";
const TYPE_HELP: Record<MoveType, string> = { IN: "Add received stock to the shelf.", OUT: "Remove stock (damage, transfer, loss).", ADJUSTMENT: "Set the quantity to a counted value." };

function StockDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const products = trpc.inventory.products.useQuery({ search: "" }); const utils = trpc.useUtils();
  const [productId, setProductId] = useState(0); const [type, setType] = useState<MoveType>("IN"); const [quantity, setQuantity] = useState("1"); const [note, setNote] = useState("");
  const selected = products.data?.find(p => p.id === productId);
  const mutate = trpc.inventory.adjustStock.useMutation({
    onSuccess: r => { toast.success(`Stock updated — now ${r.quantity} units`); utils.invalidate(); onOpenChange(false); setNote(""); setQuantity("1"); },
    onError: e => toast.error(e.message),
  });
  const submit = () => { if (!productId) return toast.error("Select a product."); const q = Number(quantity); if (!Number.isInteger(q) || q < 0) return toast.error("Enter a whole-number quantity."); mutate.mutate({ productId, type, quantity: q, note }); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="dialog-content"><DialogHeader><DialogTitle>Record stock movement</DialogTitle><DialogDescription>Every change is logged with your name for the audit trail.</DialogDescription></DialogHeader>
    <div className="form-grid">
      <div className="field"><Label>Product</Label><select className="select-field" value={productId} onChange={e => setProductId(Number(e.target.value))}><option value={0}>Select a product</option>{products.data?.map(p => <option key={p.id} value={p.id}>{p.sku} · {p.name} ({p.quantity} in stock)</option>)}</select></div>
      <div className="field"><Label>Movement type</Label><select className="select-field" value={type} onChange={e => setType(e.target.value as MoveType)}><option value="IN">Stock in</option><option value="OUT">Stock out</option><option value="ADJUSTMENT">Adjustment (set quantity)</option></select></div>
      <div className="field"><Label>{type === "ADJUSTMENT" ? "New quantity" : "Quantity"}</Label><Input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
      <div className="field"><Label>Note (optional)</Label><Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Supplier delivery PO-1042" /></div>
    </div>
    <p className="hint">{TYPE_HELP[type]}{selected ? ` Current stock: ${selected.quantity}.` : ""}</p>
    <DialogFooter><Button variant="outline" className="button-outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button className="button-primary" onClick={submit} disabled={mutate.isPending}>{mutate.isPending ? "Saving…" : "Record movement"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

export default function MovementsPage() {
  const { isManager } = useAuth(); const [filter, setFilter] = useState<"" | MoveType>(""); const [open, setOpen] = useState(false);
  const movements = trpc.inventory.movements.useQuery({ type: filter || undefined, limit: 200 });
  return <AppShell><section className="page-content"><Card className="table-card">
    <CardHeader className="table-card-header"><div><CardTitle>Stock movement history</CardTitle><p>Latest 200 entries, newest first.</p></div>
      <div className="toolbar"><select className="select-field filter-select" value={filter} onChange={e => setFilter(e.target.value as "" | MoveType)}><option value="">All types</option><option value="IN">Stock in</option><option value="OUT">Stock out</option><option value="ADJUSTMENT">Adjustments</option></select>{isManager && <Button className="button-primary" onClick={() => setOpen(true)}><Plus size={16} /> Record movement</Button>}</div></CardHeader>
    <div className="table-actions"><span>{movements.data?.length ?? 0} entries</span><Button variant="ghost" className="button-ghost" onClick={() => movements.refetch()}><RefreshCw size={15} /> Refresh</Button></div>
    <div className="table-scroll"><table className="data-table"><thead><tr><th>When</th><th>SKU</th><th>Product</th><th>Type</th><th>Note</th><th>By</th></tr></thead><tbody>{(movements.data ?? []).map(m => <tr key={m.id}><td>{m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td><td className="mono">{m.sku}</td><td><strong>{m.product}</strong></td><td><MovementBadge type={m.type} quantity={m.quantity} /></td><td>{m.note ?? "—"}</td><td>{m.user ?? "System"}</td></tr>)}</tbody></table>{!movements.data?.length && <EmptyState title="No movements yet" description="Sales and stock updates will appear here." />}</div>
  </Card></section>{isManager && <StockDialog open={open} onOpenChange={setOpen} />}</AppShell>;
}
