# Inventory Management Web Conversion Plan

## Product direction

Convert the existing Java Swing + Maven + MySQL inventory management system into a responsive React/Express/tRPC/Drizzle web application. Preserve the existing inventory_db concepts and workflows while replacing desktop navigation with a responsive application shell.

## Design

Three candidate styles were considered: **Navy Operations Console** (0.07), a bright logistics dashboard with indigo accents (0.06), and a quiet editorial back-office workspace (0.05). The selected style is **Navy Operations Console** because it preserves the existing navy inventory-management visual language while improving clarity for a college project demonstration.

### Design movement

A refined enterprise operations-console aesthetic: structured like a warehouse control room, softened with generous white space and restrained light-blue surfaces.

### Core principles

1. Information hierarchy should be visible before interaction: page title, KPI strip, then the primary working table or form.
2. Every action must look actionable: blue primary buttons, outlined secondary buttons, compact icon buttons, and clear success/error feedback.
3. Dense inventory data should remain calm and scannable through short labels, aligned numeric columns, zebra rows, and status pills.
4. Desktop density must collapse gracefully into stacked cards and horizontally scrollable tables on narrow screens.

### Color philosophy

Deep navy anchors navigation and trust, white carries the working surface, and a pale blue accent marks the current context without competing with data. Green is reserved for healthy inventory and completed actions; amber/red signals attention or risk.

### Layout paradigm

A persistent sidebar on desktop becomes a top bar plus drawer on mobile. The content canvas uses an asymmetric composition: a wide primary work surface paired with compact KPI and context modules rather than a uniform grid everywhere.

### Signature elements

- Inventory Management star mark and navy sidebar rail.
- Light-blue selected navigation state with a slim accent edge.
- Pill-shaped inventory status labels and compact KPI cards with small sparkline-like progress bars.

### Interaction philosophy

Interactions should feel immediate and safe: search filters in place, forms open in focused dialogs, destructive actions confirm, and mutations invalidate the affected queries so the UI reflects MySQL immediately.

### Animation

Use subtle 150–220ms ease-out transitions for sidebar state, page fade/slide, button hover, modal entry, and table refresh. Avoid decorative motion; animate only to show state change.

### Typography system

Use Inter for interface text and Geist Mono for compact IDs, SKUs, invoice numbers, and numeric values. Headings are semibold with tight tracking; table labels are 11–12px uppercase or medium sentence case; body text is 13–14px with muted secondary color.

### Brand essence

**Inventory Management is a clear, dependable inventory command center for small teams who need stock truth at a glance.** Personality: precise, confident, practical.

### Brand voice

Headlines are concise and operational: “Keep every unit accounted for.” CTAs are direct and reassuring: “Add product”, “Create invoice”, “Adjust stock”.

### Wordmark & logo

A four-point star mark paired with the Inventory Management wordmark; the star represents the inventory signal at the center of every workflow.

### Signature brand color

Zenith Indigo `#4F5FD5`, used for primary actions and the selected navigation edge.

## Implementation approach

- Frontend: React with Wouter route states, Tailwind CSS, Radix/shadcn primitives, lucide-react icons, Recharts for a lightweight inventory trend/summary visual.
- Backend: Extend the tRPC router with inventory procedures backed by Drizzle MySQL queries.
- Database: Add additive Drizzle table definitions/migrations for `categories`, `products`, and `stock_movements` only if they are absent; preserve existing table names and columns. Do not seed or delete existing records during normal startup.
- Data layer: Keep query functions in `server/db.ts`; use transactions for stock deduction plus movement insert.
- UI: One shared `AppShell`, page navigation, typed query hooks, reusable `DataTable`, `StatCard`, `StatusBadge`, `ProductDialog`, `CategoryDialog`, and `InvoiceDialog` components.
- Routes: `/`, `/administration`, `/warehouse`, `/products`, `/categories`, `/pos`; the shell will also support query-state navigation for a compact single-app feel.
- Frontend/backend serving: `pnpm dev` serves Vite and Express on the configured port. `GET /manus-routes.json` will declare the six UI routes.

## Project structure

- `client/src/App.tsx`: route switch and app shell entry.
- `client/src/pages/`: Dashboard, Administration, Warehouse, Products, Categories, POS pages.
- `client/src/components/inventory-management/`: shared shell, KPI, data table, dialogs, badges.
- `client/src/index.css`: Inventory Management design tokens, responsive layout, table and status styles.
- `server/routers.ts`: typed inventory API procedures.
- `server/db.ts`: MySQL queries and transactional inventory operations.
- `drizzle/schema.ts`: existing user model plus inventory table definitions.
- `drizzle/`: additive migration files.
- `public/manus-routes.json`: route manifest for the platform.
