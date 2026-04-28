# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (http://localhost:3000)
npm run build        # production build
npm run lint         # ESLint

npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma studio                      # GUI to browse the database
npx prisma generate                    # regenerate client after schema change
npm run seed                           # seed dev database (uses jiti to run prisma/seed.ts)
```

There are no tests. TypeScript is the primary correctness check: `npx tsc --noEmit`.

## Architecture

### Domain model

The app manages a construction contracting lifecycle: **Lead → Client → Project → Quote → Payment**.

- A `Lead` can be converted to a `Client` (via `POST /api/leads/[id]/convert`), which runs a Prisma transaction: marks the lead `CONVERTED`, creates the `Client`, links `Client.leadId`, and creates an onboarding `Task`.
- A `Client` owns multiple `Project`s and `Quote`s. Client financials (`totalContracts`, `totalPaid`, `balance`) are computed on read in `lib/calculations.ts`.
- A `Quote` belongs to a client and optionally a project. When status is `APPROVED`, the UI offers "פתח פרויקט" which creates a `Project` and links `Quote.projectId`.
- `Payment` records are always attached to both a `Project` and a `Client`.
- `Task`, `Meeting`, and `Notification` are cross-cutting — each can be linked to a lead, client, or project.

### Database

SQLite via Prisma 5. **Enums are not used** — SQLite doesn't support them natively. All status/type fields are plain `String` with allowed values documented in comments in `schema.prisma` and enforced as `as const` objects in `types/index.ts`. The `DATABASE_URL` env var must point to the `.db` file (e.g. `file:./dev.db`).

### API layer

All data access goes through Next.js Route Handlers in `app/api/`. Each resource follows REST conventions:

| Pattern | Purpose |
|---|---|
| `app/api/<resource>/route.ts` | `GET` list, `POST` create |
| `app/api/<resource>/[id]/route.ts` | `GET` one, `PATCH` update, `DELETE` |
| `app/api/<resource>/[id]/<sub>/route.ts` | nested resource (e.g. payments, milestones, notes) |

Route handler params use the Next.js 15+ async pattern: `{ params }: { params: Promise<{ id: string }> }` — always `await params`.

Server pages (e.g. `app/(crm)/projects/[id]/page.tsx`) call Prisma directly. Client pages (e.g. leads, quotes detail) fetch from the API routes via `useEffect`.

### Frontend structure

- **`app/layout.tsx`** — sets `lang="he" dir="rtl"`, dark background. RTL is global and unconditional.
- **`app/(crm)/layout.tsx`** — the shell: `Sidebar` + `Header` + scrollable `<main>`. All CRM pages live inside this route group.
- **`components/ui/`** — RTL-first primitives (`Button`, `Card`, `Input`, `Select`, `Modal`, `Tabs`). Use these exclusively; do not introduce external component libraries.
- **`components/shared/`** — cross-cutting display components: `StatusBadge`, `EmptyState`, `ConfirmModal`.
- **`components/<domain>/`** — feature components. Detail pages (e.g. `ProjectDetail`, `ClientDetail`) are large `'use client'` components that own local state and call API routes directly.
- **`lib/calculations.ts`** — all financial math: `calcLinePrice`, `calcQuoteSummary` (17% VAT), `calcClientFinancials`. Import from here rather than re-implementing inline.
- **`types/index.ts`** — re-exports Prisma types plus app-level label/color maps for every status string.

### Quote calculator math

```
linePrice      = (dim1 ?? 1) × (dim2 ?? 1) × unitPrice
subtotal       = Σ linePrice
totalBeforeVAT = max(0, subtotal − discount)
vat            = totalBeforeVAT × 0.17
totalWithVAT   = totalBeforeVAT + vat
```

### PDF export

`@react-pdf/renderer` cannot run server-side. `PDFExportButton` lazy-loads both the renderer and `QuotePDF` inside `useEffect` to avoid SSR errors. Follow this pattern for any future PDF work.

### Styling conventions

- Dark palette: `bg-gray-900` base, `bg-gray-800` cards, `bg-gray-700` inputs.
- Accent: blue `#3B82F6` / purple `#8B5CF6`.
- Hover-reveal action buttons use `opacity-0 group-hover:opacity-100` — requires `group` on the parent `<Card>` or `<tr>`.
- Use Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`) rather than `pl-`/`pr-` when direction matters.
