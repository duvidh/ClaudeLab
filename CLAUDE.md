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

- A `Lead` converts to a `Client` via `POST /api/leads/[id]/convert` — runs a Prisma transaction: marks lead `CONVERTED`, creates `Client`, sets `Client.leadId`, creates an onboarding `Task`. The converted lead's detail page shows a link to the new client card.
- A `Client` owns `Project`s and `Quote`s. Client financials (`totalContracts`, `totalPaid`, `balance`) are computed in `lib/calculations.ts`.
- An `APPROVED` quote can spawn a `Project` via the "פתח פרויקט" button (sets `Quote.projectId` and creates a `Project` with `contractValue` from the quote total).
- A quote can be duplicated via `POST /api/quotes/[id]/duplicate` — creates a new `DRAFT` with `version + 1` and copies all items.
- `Payment` records attach to both a `Project` and a `Client`.
- `Task`, `Meeting`, and `Notification` are cross-cutting — each can link to a lead, client, or project.

### Database

SQLite via Prisma 5. **No enums** — SQLite doesn't support them. All status/type fields are plain `String`. Allowed values are defined as `as const` objects in `types/index.ts` (e.g. `LEAD_STATUS`, `PROJECT_STATUS_LABELS`, `QUOTE_STATUS_LABELS`) and documented in comments in `schema.prisma`.

### API layer

All mutations go through Next.js Route Handlers in `app/api/`. Standard pattern:

| Pattern | Purpose |
|---|---|
| `app/api/<resource>/route.ts` | `GET` list, `POST` create |
| `app/api/<resource>/[id]/route.ts` | `GET` one, `PATCH` update, `DELETE` |
| `app/api/<resource>/[id]/<sub>/route.ts` | nested resource (payments, milestones, notes, etc.) |

**Always `await params`** — Next.js 15+ route handler params are `Promise<{ id: string }>`.

Server-rendered pages (e.g. `projects/[id]/page.tsx`, `clients/[id]/page.tsx`) call Prisma directly. Client-rendered pages (e.g. leads detail, quotes detail) fetch from API routes via `useEffect`.

### Notifications

`lib/notify.ts` exports a fire-and-forget `notify(message, type?, relatedEntity?)` helper that writes a `Notification` row. Call it from API routes after key events — it silently swallows errors so it never breaks the main flow. Currently wired in: lead conversion, quote status change (APPROVED/REJECTED), payment creation, milestone completion.

The `Header` component polls `GET /api/notifications` for the unread count on mount and loads the full list when the bell is opened. Supports per-notification and mark-all-read via `PATCH /api/notifications`.

### Global search

`GET /api/search?q=<query>` searches leads, clients, and projects by name/phone and returns typed `SearchResult[]` with `href` for navigation. The `GlobalSearch` component in `Header` debounces at 250 ms and opens a dropdown — minimum 2 characters to trigger.

### Frontend structure

- **`app/layout.tsx`** — sets `lang="he" dir="rtl"`, dark background. RTL is global and unconditional.
- **`app/(crm)/layout.tsx`** — shell: `Sidebar` + `Header` + scrollable `<main>`. All CRM pages live inside this route group.
- **`components/ui/`** — RTL-first primitives (`Button`, `Card`, `Input`, `Select`, `Modal`, `Tabs`). Do not introduce external component libraries.
- **`components/shared/`** — cross-cutting display components: `StatusBadge`, `EmptyState`, `ConfirmModal`.
- **`components/<domain>/`** — feature components. Detail components (e.g. `ProjectDetail`, `ClientDetail`, `LeadDetail`) are large `'use client'` components that own all local state and call API routes directly.
- **`lib/calculations.ts`** — all financial math: `calcLinePrice`, `calcQuoteSummary` (17% VAT), `calcClientFinancials`. Import from here; do not reimplement inline.
- **`types/index.ts`** — re-exports Prisma types, status constants (`LEAD_STATUS`, etc.), label maps (`LEAD_STATUS_LABELS`, `PROJECT_STATUS_LABELS`, etc.), color maps, and `WithRelations` composite types (`LeadWithRelations`, `ClientWithRelations`, `ProjectWithRelations`, `QuoteWithRelations`).

### Settings persistence

Settings (company info, editable dropdown lists) persist to `localStorage` under `crm-settings-company` and `crm-settings-lists`. No DB model. The settings page loads from `localStorage` on mount via `useEffect` and writes on explicit save. `GET /api/settings/stats` returns live record counts for all models displayed on the "נתוני מערכת" tab.

### Quote calculator math

```
linePrice      = (dim1 ?? 1) × (dim2 ?? 1) × unitPrice
subtotal       = Σ linePrice
totalBeforeVAT = max(0, subtotal − discount)
vat            = totalBeforeVAT × 0.17
totalWithVAT   = totalBeforeVAT + vat
```

### PDF export

`@react-pdf/renderer` cannot run server-side. `PDFExportButton` lazy-loads both the renderer and `QuotePDFDocument` inside `useEffect` via `Promise.all([import('@react-pdf/renderer'), import('./QuotePDF')])` to avoid SSR crashes. Follow this exact pattern for any future PDF work.

### Styling conventions

- Dark palette: `bg-gray-900` base, `bg-gray-800` cards, `bg-gray-700` inputs.
- Accent: blue `#3B82F6` / purple `#8B5CF6`.
- Hover-reveal action buttons: `opacity-0 group-hover:opacity-100` — requires `group` on the parent `<Card>` or `<tr>`.
- Use Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`) rather than `pl-`/`pr-` when direction matters.
- Inline status dropdowns (e.g. in `LeadsTable`) use `openStatusId` state + `useRef` + `useEffect` outside-click handler to close on blur.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
