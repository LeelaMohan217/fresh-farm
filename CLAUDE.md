# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Webpack mode)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run (CI)
npx vitest run path/to/test.ts   # Run a single test file
npm run test:agent   # AI-assisted test generation via Claude API
npm run reset-admin-password     # Reset admin password via CLI
npx tsx prisma/seed.ts           # Seed database with sample data
```

## Architecture

This is a **Next.js 16 full-stack app** (App Router) for a farm e-commerce and service platform. It has two separate authenticated portals — a customer-facing storefront and an admin panel — plus a public landing area.

### Route Groups

- `src/app/(auth)/` — Customer login/register (no layout wrapper)
- `src/app/(user)/` — Customer portal with shared `layout.tsx`; requires customer auth via `AuthContext`
- `src/app/admin/(protected)/` — Admin panel with its own `layout.tsx`; auth guarded server-side via `getAdminSession()`
- `src/app/api/` — API routes split into `auth/` (customer) and `admin/` (admin CRUD)

### Authentication

Two independent JWT sessions using `jose`:
- **Customer**: `ff_token` cookie — verified via `getSession()` in `src/lib/auth.ts`
- **Admin**: `ff_admin_token` cookie — verified via `getAdminSession()` / `getAdminSessionFromRequest()`

Tokens are 7-day HS256 JWTs. Secrets fall back to hardcoded defaults if env vars are absent.

### Database

PostgreSQL via a single raw `pg` pool in `src/lib/pg.ts`. All API routes use this directly with parameterised queries.

Default local connection: `postgresql://postgres:admin@localhost:5432/farmfresh`

Schema reference: `prisma/schema.prisma` (kept for documentation; Prisma is not used at runtime).

### Key Data Models

`User` (admins) · `Customer` · `Product` / `Category` · `Order` / `OrderItem` · `BulkOrder` (event catering) · `Service` (Hydroponic/Aeroponic) · `PasswordResetToken`

### Component Organization

- `src/components/ui/` — shadcn primitives (base-nova theme, Tailwind CSS variables)
- `src/components/admin/` — admin-specific tables, forms, charts (Recharts)
- `src/components/user/` — customer-facing Navbar, shop, service sections
- `src/context/` — `AuthContext` (customer session) and `CartContext` (shopping cart)

### Path Alias

`@/*` resolves to `src/*` (defined in `tsconfig.json`).

### Testing

Tests live in `__tests__/`. The `scripts/test-agent.ts` script uses the Anthropic SDK to auto-generate and iterate on tests using `vitest`.

### Image Uploads

Admin product images are uploaded via `POST /api/admin/upload` and served from `public/uploads/`. The `next.config.ts` also allows remote images from Unsplash.
