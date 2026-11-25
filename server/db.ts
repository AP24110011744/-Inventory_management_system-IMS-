import { and, asc, count, desc, eq, gte, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { categories, products, stockMovements, InsertUser, User, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() { if (!_db && process.env.DATABASE_URL) { try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; } } return _db; }

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId }; const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date(); if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
export async function getUserByOpenId(openId: string) { const db=await getDb(); if(!db)return undefined; const result=await db.select().from(users).where(eq(users.openId,openId)).limit(1); return result[0]; }

function productView(row: any) { return { id: row.products.id, sku: row.products.sku, name: row.products.name, categoryId: row.products.categoryId, category: row.categories?.name ?? "Uncategorized", supplier: row.products.supplier ?? "—", quantity: row.products.quantity, reorderLevel: row.products.reorderLevel, unitPrice: Number(row.products.unitPrice ?? 0), status: row.products.quantity <= row.products.reorderLevel ? "LOW STOCK" : "In Stock" }; }
export async function listProducts(search = "") {
  const db=await getDb(); if(!db) throw new Error("Database is not available"); const q=`%${search.trim()}%`;
  const rows=await db.select().from(products).leftJoin(categories,eq(products.categoryId,categories.id)).where(or(like(products.sku,q),like(products.name,q),like(categories.name,q))).orderBy(asc(products.id));
  return rows.map(productView);
}
export async function getProduct(id:number){const db=await getDb();if(!db)throw new Error("Database is not available");const rows=await db.select().from(products).leftJoin(categories,eq(products.categoryId,categories.id)).where(eq(products.id,id)).limit(1);return rows[0]?productView(rows[0]):undefined;}
export async function dashboardStats(){const db=await getDb();if(!db)throw new Error("Database is not available");const [total]=await db.select({value:count()}).from(products);const [low]=await db.select({value:count()}).from(products).where(sql`${products.quantity} <= ${products.reorderLevel}`);const [value]=await db.select({value:sql<string>`COALESCE(SUM(${products.quantity} * ${products.unitPrice}), 0)`}).from(products);return {totalProducts:Number(total?.value??0),lowStock:Number(low?.value??0),inventoryValue:Number(value?.value??0)};}
export async function warehouseStats(){const stats=await dashboardStats();const db=await getDb();if(!db)throw new Error("Database is not available");return {...stats,totalUnits:Number((await db.select({value:sql<string>`COALESCE(SUM(${products.quantity}), 0)`}).from(products))[0]?.value??0),products:await listProducts("")};}
export async function listCategories(search=""){const db=await getDb();if(!db)throw new Error("Database is not available");const q=`%${search.trim()}%`;return db.select({id:categories.id,name:categories.name}).from(categories).where(like(categories.name,q)).orderBy(asc(categories.name));}
export async function createCategory(name:string){const db=await getDb();if(!db)throw new Error("Database is not available");const value=name.trim();if(!value)throw new Error("Category name is required.");await db.insert(categories).values({name:value});return {success:true};}
export async function updateCategory(id:number,name:string){const db=await getDb();if(!db)throw new Error("Database is not available");const value=name.trim();if(!value)throw new Error("Category name is required.");await db.update(categories).set({name:value}).where(eq(categories.id,id));return {success:true};}
export async function deleteCategory(id:number){const db=await getDb();if(!db)throw new Error("Database is not available");const used=await db.select({value:count()}).from(products).where(eq(products.categoryId,id));if(Number(used[0]?.value??0)>0)throw new Error("This category cannot be deleted because products are assigned to it.");await db.delete(categories).where(eq(categories.id,id));return {success:true};}
async function categoryId(db:any,name:string){const found=await db.select({id:categories.id}).from(categories).where(eq(categories.name,name)).limit(1);if(!found[0])throw new Error("Category not found.");return found[0].id;}
export async function saveProduct(input:{id?:number;sku:string;name:string;category:string; supplier?:string;quantity:number;reorderLevel:number;unitPrice:number}){const db=await getDb();if(!db)throw new Error("Database is not available");if(!input.sku.trim()||!input.name.trim())throw new Error("SKU and product name are required.");if(input.quantity<0||input.reorderLevel<0||input.unitPrice<0)throw new Error("Quantity, reorder level and price cannot be negative.");const categoryIdValue=await categoryId(db,input.category);const values={sku:input.sku.trim(),name:input.name.trim(),categoryId:categoryIdValue,supplier:input.supplier?.trim()||null,quantity:input.quantity,reorderLevel:input.reorderLevel,unitPrice:input.unitPrice.toFixed(2)};if(input.id)await db.update(products).set(values).where(eq(products.id,input.id));else await db.insert(products).values(values);return {success:true};}
export async function deleteProduct(id:number){const db=await getDb();if(!db)throw new Error("Database is not available");await db.delete(products).where(eq(products.id,id));return {success:true};}
export async function createSale(input:{productId:number;quantity:number},userId?:number){const db=await getDb();if(!db)throw new Error("Database is not available");if(input.quantity<=0)throw new Error("Quantity must be greater than zero.");return db.transaction(async tx=>{const rows=await tx.select().from(products).where(eq(products.id,input.productId)).limit(1);const product=rows[0];if(!product)throw new Error("Product not found.");if(input.quantity>product.quantity)throw new Error(`Insufficient stock. Available quantity: ${product.quantity}.`);await tx.update(products).set({quantity:sql`${products.quantity} - ${input.quantity}`}).where(and(eq(products.id,input.productId),gte(products.quantity,input.quantity)));await tx.insert(stockMovements).values({productId:input.productId,movementType:"OUT",quantity:input.quantity,note:"POS sale / invoice",userId:userId??null});return {success:true,sku:product.sku,name:product.name,quantity:input.quantity,unitPrice:Number(product.unitPrice),total:Number(product.unitPrice)*input.quantity};});}

// ---------- Users / auth ----------
export type PublicUser = Omit<User, "passwordHash">;
export function toPublicUser(u: User): PublicUser { const { passwordHash: _omit, ...rest } = u; return rest; }
export async function getUserById(id: number) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0]; }
export async function getUserByEmail(email: string) { const db = await getDb(); if (!db) return undefined; return (await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1))[0]; }
export async function countUsers() { const db = await getDb(); if (!db) throw new Error("Database is not available"); const [r] = await db.select({ value: count() }).from(users); return Number(r?.value ?? 0); }
export async function createLocalUser(input: { name: string; email: string; passwordHash: string }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const email = input.email.trim().toLowerCase();
  if (await getUserByEmail(email)) throw new Error("An account with this email already exists.");
  // The very first account becomes the administrator; everyone after is staff.
  const role = (await countUsers()) === 0 ? "admin" : "user";
  const openId = `local:${crypto.randomUUID()}`;
  await db.insert(users).values({ openId, name: input.name.trim(), email, passwordHash: input.passwordHash, loginMethod: "password", role, lastSignedIn: new Date() });
  return (await getUserByEmail(email))!;
}
export async function touchLastSignedIn(id: number) { const db = await getDb(); if (!db) return; await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id)); }
export async function updateUserProfile(id: number, data: { name?: string; passwordHash?: string }) { const db = await getDb(); if (!db) throw new Error("Database is not available"); await db.update(users).set(data).where(eq(users.id, id)); }
export async function listUsers() { const db = await getDb(); if (!db) throw new Error("Database is not available"); const rows = await db.select().from(users).orderBy(asc(users.id)); return rows.map(toPublicUser); }
export async function updateUserAccess(actorId: number, id: number, data: { role?: "user" | "manager" | "admin"; isActive?: boolean }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const target = await getUserById(id); if (!target) throw new Error("User not found.");
  const losesAdmin = target.role === "admin" && ((data.role && data.role !== "admin") || data.isActive === false);
  if (id === actorId && (data.isActive === false || (data.role && data.role !== "admin"))) throw new Error("You cannot remove your own admin access or deactivate yourself.");
  if (losesAdmin) {
    const [r] = await db.select({ value: count() }).from(users).where(and(eq(users.role, "admin"), eq(users.isActive, true)));
    if (Number(r?.value ?? 0) <= 1) throw new Error("At least one active administrator is required.");
  }
  await db.update(users).set(data).where(eq(users.id, id));
  return { success: true };
}

// ---------- Stock movements & analytics ----------
export async function listMovements(opts: { type?: "IN" | "OUT" | "ADJUSTMENT"; limit?: number } = {}) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const rows = await db.select({ id: stockMovements.id, type: stockMovements.movementType, quantity: stockMovements.quantity, note: stockMovements.note, createdAt: stockMovements.createdAt, sku: products.sku, product: products.name, user: users.name })
    .from(stockMovements).innerJoin(products, eq(stockMovements.productId, products.id)).leftJoin(users, eq(stockMovements.userId, users.id))
    .where(opts.type ? eq(stockMovements.movementType, opts.type) : undefined).orderBy(desc(stockMovements.id)).limit(opts.limit ?? 100);
  return rows;
}
export async function adjustStock(input: { productId: number; type: "IN" | "OUT" | "ADJUSTMENT"; quantity: number; note?: string }, userId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  if (!Number.isInteger(input.quantity) || input.quantity < 0 || (input.type !== "ADJUSTMENT" && input.quantity === 0)) throw new Error("Enter a valid whole-number quantity.");
  return db.transaction(async tx => {
    const [product] = await tx.select().from(products).where(eq(products.id, input.productId)).limit(1).for("update");
    if (!product) throw new Error("Product not found.");
    let next = product.quantity;
    if (input.type === "IN") next += input.quantity; else if (input.type === "OUT") next -= input.quantity; else next = input.quantity;
    if (next < 0) throw new Error(`Insufficient stock. Available quantity: ${product.quantity}.`);
    await tx.update(products).set({ quantity: next }).where(eq(products.id, input.productId));
    const moved = input.type === "ADJUSTMENT" ? Math.abs(next - product.quantity) : input.quantity;
    await tx.insert(stockMovements).values({ productId: input.productId, movementType: input.type, quantity: moved, note: (input.note?.trim() || (input.type === "ADJUSTMENT" ? `Adjusted from ${product.quantity} to ${next}` : "Manual stock update")).slice(0, 255), userId });
    return { success: true, quantity: next };
  });
}
export async function dashboardInsights() {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const lowStockItems = (await listProducts("")).filter(p => p.status === "LOW STOCK").sort((a, b) => a.quantity - b.quantity).slice(0, 6);
  const byCategory = await db.select({ name: categories.name, value: sql<string>`COALESCE(SUM(${products.quantity} * ${products.unitPrice}), 0)`, units: sql<string>`COALESCE(SUM(${products.quantity}), 0)` })
    .from(categories).leftJoin(products, eq(products.categoryId, categories.id)).groupBy(categories.id, categories.name).orderBy(asc(categories.name));
  const trendRows = await db.select({ day: sql<string>`DATE_FORMAT(${stockMovements.createdAt}, '%Y-%m-%d')`, units: sql<string>`SUM(${stockMovements.quantity})`, revenue: sql<string>`SUM(${stockMovements.quantity} * ${products.unitPrice})` })
    .from(stockMovements).innerJoin(products, eq(stockMovements.productId, products.id))
    .where(and(eq(stockMovements.movementType, "OUT"), gte(stockMovements.createdAt, sql`DATE_SUB(CURDATE(), INTERVAL 6 DAY)`)))
    .groupBy(sql`DATE_FORMAT(${stockMovements.createdAt}, '%Y-%m-%d')`);
  const map = new Map(trendRows.map(r => [r.day, r]));
  const salesTrend = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; const r = map.get(key); return { day: key, units: Number(r?.units ?? 0), revenue: Number(r?.revenue ?? 0) }; });
  const [users_] = await db.select({ value: count() }).from(users);
  return { lowStockItems, categoryBreakdown: byCategory.map(c => ({ name: c.name, value: Number(c.value), units: Number(c.units) })), salesTrend, recentMovements: await listMovements({ limit: 6 }), userCount: Number(users_?.value ?? 0) };
}
