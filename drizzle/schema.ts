import { boolean, int, mysqlEnum, mysqlTable, decimal, text, timestamp, varchar, index } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "manager", "admin"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  categoryId: int("category_id").notNull().references(() => categories.id),
  supplier: varchar("supplier", { length: 120 }),
  quantity: int("quantity").notNull().default(0),
  reorderLevel: int("reorder_level").notNull().default(10),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull().default("0.00"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({ categoryIdx: index("products_category_idx").on(table.categoryId) }));

export const stockMovements = mysqlTable("stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull().references(() => products.id),
  movementType: mysqlEnum("movement_type", ["IN", "OUT", "ADJUSTMENT"]).notNull(),
  quantity: int("quantity").notNull(),
  note: varchar("note", { length: 255 }),
  userId: int("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({ productIdx: index("stock_movements_product_idx").on(table.productId) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
