# Inventory Management Web Conversion TODO

## 1. Responsive application shell and navigation

- [x] Build a responsive web application shell with a dark navy sidebar on desktop and a mobile navigation drawer/top bar.
- [x] Provide functional navigation for Dashboard, Administration, Warehouse, Products, Categories, and POS / Invoice.
- [x] Show clear selected states, hover feedback, readable text, and consistent navy, white, light-blue, green, amber and red styling.

## 2. Database model and API

- [x] Preserve the existing inventory_db concepts and records; avoid destructive migrations.
- [x] Define or reuse `categories`, `products`, and `stock_movements` with the existing relationships.
- [x] Add typed tRPC procedures for dashboard metrics, product search/CRUD, category CRUD, warehouse stock, and transactional POS sale creation.
- [x] Ensure POS stock deduction and stock movement recording occur transactionally with available-stock validation.

## 3. Dashboard and administration

- [x] Display total products, low-stock alerts, total inventory value, and a product overview derived from MySQL.
- [x] Display application, version, platform, database and current-user information in organized cards.

## 4. Warehouse

- [x] Display total stock units, available product count, low-stock count, and a stock overview table with SKU, product name, category, current stock, reorder level and status.

## 5. Products

- [x] Display searchable/filterable products with SKU, product name, category, supplier, stock, reorder level, price and status.
- [x] Provide Add Product, Edit Product and Delete Product workflows with validation and mutation refresh.
- [x] Format prices as Indian Rupees.

## 6. Categories

- [x] Display categories in a searchable table.
- [x] Provide Add Category, Edit Category, Delete Category and Refresh workflows.
- [x] Confirm destructive deletion and protect categories assigned to products.

## 7. POS / Invoice

- [x] Provide product selection, quantity validation, available-stock validation and price-times-quantity calculation.
- [x] Display a professional Indian Rupee invoice summary.
- [x] Deduct stock and record the sale in `stock_movements` after a successful invoice.

## 8. Validation and delivery

- [x] Add route manifest and project metadata.
- [x] Run TypeScript diagnostics, tests and production build.
- [x] Start Preview, verify the app responds, inspect all six routes, and save a checkpoint to the canonical repository.
