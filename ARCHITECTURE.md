# Construction CRM — Architecture Source of Truth

> Last updated: 2026-04-30. Hebrew RTL SPA for a construction contracting company.
> Lifecycle covered: **Lead → Client → Project → Quote → Payment**.

---

## Stack

| Layer | Package | Version |
|---|---|---|
| Framework | `next` | 16.2.4 |
| Language | TypeScript | ^5 |
| Runtime | React | 19.2.4 |
| Styling | `tailwindcss` | ^4 |
| ORM | `prisma` + `@prisma/client` | ^5.22.0 |
| Database | SQLite (file: `prisma/dev.db`) | — |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | ^7 / ^4 / ^5 |
| Charts | `recharts` | ^3 |
| PDF | `@react-pdf/renderer` | ^4 |
| Icons | `lucide-react` | ^1 |
| Dates | `date-fns` | ^4 |
| State | `zustand` | ^5 (available, mostly unused — components use local state) |
| CSS utils | `clsx` | ^2 |
| Font | `@fontsource/heebo` | ^5 |
| Seeding | `jiti` (via `node --import=jiti/register`) | — |

**Dev commands:**
```bash
npm run dev          # http://localhost:3000
npm run build
npm run lint         # ESLint (0 errors, 0 warnings as of 2026-04-30)
npm run seed         # node --import=jiti/register prisma/seed.ts
npx prisma migrate dev --name <name>
npx prisma generate
npx prisma studio
npx tsc --noEmit     # type check
```

---

## Domain Model Relationships

```
Lead ──(1:1, converted)──► Client
                              │
                   ┌──────────┼───────────┬──────────┐
                Project     Quote      Invoice    Task/Meeting
                   │           │
               Milestone   QuoteItem ──► CatalogItem
               Payment
               ProjectFile
               Task
```

**Key lifecycle operations:**

- `POST /api/leads/[id]/convert` — Prisma transaction: sets `Lead.status = CONVERTED`, creates `Client`, links `Client.leadId`, creates onboarding `Task`.
- `PATCH /api/quotes/[id]` with `status: APPROVED` → UI offers "פתח פרויקט" button, which creates a `Project` with `contractValue` from quote total and sets `Quote.projectId`.
- `POST /api/quotes/[id]/duplicate` — creates new `DRAFT` quote with `version + 1`, copies all `QuoteItem` rows.
- `POST /api/clients/[id]/payments` — creates `Payment` linked to both `Project` and `Client`.

---

## Database Schema (Prisma — `prisma/schema.prisma`)

**Important:** SQLite does not support Prisma enums. All status/type columns are plain `String`. Allowed values are defined as `as const` maps in `types/index.ts`.

### Lead
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| fullName | String | |
| primaryPhone | String | |
| secondaryPhone | String? | |
| email | String? | |
| propertyAddress | String? | |
| city | String? | |
| clientType | String | `PRIVATE` \| `BUSINESS` |
| leadSource | String | `WEBSITE` \| `REFERRAL` \| `FACEBOOK` \| `GOOGLE` \| `PHONE` \| `OTHER` |
| status | String | `NEW` \| `CONTACTED` \| `MEETING_SCHEDULED` \| `QUOTE_SENT` \| `WON` \| `LOST` \| `CONVERTED` |
| assignedRep | String? | |
| workType | String? | |
| needDescription | String? | |
| estimatedSize | Float? | sqm |
| budget | Float? | |
| desiredStartDate | DateTime? | |
| urgency | String | `LOW` \| `MEDIUM` \| `HIGH` |
| buildingPermit | Boolean | |
| nextMeetingDate | DateTime? | |
| lossReason | String? | |
| quoteStatus | String? | |
| convertedAt | DateTime? | set on conversion |
| entryDate | DateTime | |
| deletedAt | DateTime? | soft-delete |
| createdAt / updatedAt | DateTime | |
| **Relations** | | notes, meetings, files, tasks, client (1:1) |

### Client
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| company | String? | |
| idNumber | String? | ח.פ / ת.ז |
| address | String? | |
| mailingAddress | String? | added via migration |
| city | String? | |
| phones | String | JSON array `[]` |
| email | String? | |
| category | String | `PRIVATE` \| `BUSINESS` |
| status | String | `ACTIVE` \| `INACTIVE` |
| joinDate | DateTime | |
| leadId | String? unique | FK → Lead |
| paymentMethod | String? | |
| notes | String? | |
| deletedAt | DateTime? | soft-delete |
| **Relations** | | projects, quotes, invoices, meetings, tasks, files |

### Project
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| clientId | String | FK → Client |
| address | String? | |
| projectType | String? | |
| status | String | `PLANNING` \| `ACTIVE` \| `PAUSED` \| `COMPLETED` \| `CANCELLED` |
| projectManager | String? | |
| fieldTeam | String? | JSON array |
| startDate / plannedEndDate / actualEndDate | DateTime? | |
| progressPercent | Int | 0–100 |
| contractValue | Float | |
| notes | String? | |
| **Relations** | | milestones, quotes, payments, tasks, files |

### Milestone
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| projectId | String | FK → Project (cascade delete) |
| name | String | |
| plannedDate / actualDate | DateTime? | |
| status | String | `PENDING` \| `IN_PROGRESS` \| `DONE` |
| order | Int | sort order |

### Quote
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quoteNumber | String unique | format: `Q{year}-{0001}` |
| clientId | String | FK → Client |
| projectId | String? | FK → Project |
| date | DateTime | |
| validUntil | DateTime? | expiration alerts: amber 7d / red expired |
| status | String | `DRAFT` \| `SENT` \| `APPROVED` \| `REJECTED` \| `EXPIRED` |
| version | Int | increments on duplicate |
| discount | Float | absolute amount (not %) |
| paymentTerms | String? | |
| notes | String? | |
| **Relations** | | items |

### QuoteItem
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| quoteId | String | FK → Quote (cascade delete) |
| sequenceNumber | Int | display order |
| catalogItemId | String? | FK → CatalogItem |
| productName | String | |
| category | String? | |
| dimension1 | Float? | meters |
| dimension2 | Float? | centimeters → converted to meters in calc |
| unit | String? | |
| unitPrice | Float | |
| materialsCost / transportCost / laborCost | Float | cost breakdown |
| notes | String? | |

### CatalogItem
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| sku | String unique | |
| name | String | |
| category | String? | |
| unit | String? | |
| salePrice / selfCost | Float | |
| supplier | String? | |
| stock | Float? | |
| isActive | Boolean | |

### Payment
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| projectId | String | FK → Project |
| clientId | String? | denormalized FK → Client |
| amount | Float | |
| date | DateTime | |
| method | String? | |
| reference | String? | |
| notes | String? | |
| invoiceId | String? | FK → Invoice |

### Invoice
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| clientId | String | FK → Client |
| number | String unique | |
| amount | Float | |
| date / dueDate | DateTime | |
| isPaid | Boolean | |
| pdfUrl | String? | |

### Task
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| title / description | String | |
| assignedTo | String? | |
| dueDate | DateTime? | |
| status | String | `PENDING` \| `IN_PROGRESS` \| `DONE` |
| priority | String | `LOW` \| `MEDIUM` \| `HIGH` |
| taskType | String | `TASK` \| `CALL` \| `MEETING` \| `EMAIL` \| `FOLLOWUP` \| `ADMINISTRATIVE` \| `OTHER` |
| leadId / clientId / projectId | String? | polymorphic links |

### Meeting
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| leadId / clientId | String? | attaches to either |
| date | DateTime | |
| type | String | `שיחה` \| `פגישה` |
| summary | String? | |

### Employee
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| role | String | `INTERNAL` \| `EXTERNAL` |
| position | String? | |
| wageType | String | `MONTHLY` \| `HOURLY` \| `PER_PROJECT` |
| wageAmount | Float | |
| status | String | `ACTIVE` \| `INACTIVE` |
| startDate | DateTime? | |
| phone / email / notes | String? | |

### Supplier
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| name | String | |
| contactName / phone / email / address | String? | |
| category | String? | |
| notes | String? | |
| isActive | Boolean | |

### File relations (cascade delete)
- `LeadFile` — leadId → Lead
- `ClientFile` — clientId → Client (`fileType`: `contract` \| `permit` \| `plan` \| `photo` \| `other`)
- `ProjectFile` — projectId → Project

### Notification
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| message | String | |
| type | String | `info` \| `warning` \| `success` \| `error` |
| isRead | Boolean | |
| relatedEntity | String? | e.g. `lead:abc123` |

---

## API Routes

All route handlers follow the pattern: `GET` list + `POST` create on collection routes; `GET` one + `PATCH` update + `DELETE` on `[id]` routes.

**Always `await params`** in handlers — Next.js 15+ route params are `Promise<{ id: string }>`.

```
/api/auth/login            POST  (basic auth stub)
/api/auth/logout           POST

/api/dashboard             GET   KPI aggregates (leads, projects, revenue, tasks)
/api/search                GET   ?q= — searches leads + clients + projects, returns {type,id,name,href}[]
/api/calendar              GET   All events (meetings + tasks + project start/end dates) for a month
/api/notifications         GET, POST, PATCH  (PATCH: mark read — ?id= or ?all=true)
/api/finance               GET   12-month bar chart data, top clients, recent payments
/api/settings/stats        GET   Live record counts for all models
/api/recycle-bin           GET, PATCH  (PATCH: restore by {id, type})

/api/leads                 GET, POST
/api/leads/[id]            GET, PATCH, DELETE (soft-delete via deletedAt)
/api/leads/[id]/convert    POST  — Lead → Client Prisma transaction
/api/leads/[id]/notes      GET, POST
/api/leads/[id]/files      GET, POST (multipart), DELETE

/api/clients               GET, POST
/api/clients/[id]          GET, PATCH, DELETE (soft-delete)
/api/clients/[id]/payments GET, POST
/api/clients/[id]/files    GET, POST (multipart), DELETE

/api/projects              GET, POST
/api/projects/[id]         GET, PATCH, DELETE
/api/projects/[id]/milestones   GET, POST, PATCH, DELETE
/api/projects/[id]/payments     GET, POST
/api/projects/[id]/files        GET, POST (multipart), DELETE

/api/quotes                GET, POST
/api/quotes/[id]           GET, PATCH, DELETE
/api/quotes/[id]/items     GET, POST, PATCH, DELETE
/api/quotes/[id]/duplicate POST  — creates DRAFT with version+1, copies items

/api/catalog               GET, POST
/api/catalog/[id]          GET, PATCH, DELETE

/api/tasks                 GET, POST, PATCH, DELETE

/api/meetings              GET, POST, DELETE

/api/employees             GET, POST
/api/employees/[id]        GET, PATCH, DELETE

/api/suppliers             GET, POST
/api/suppliers/[id]        GET, PATCH, DELETE

/api/invoices              GET, POST
/api/invoices/[id]         GET, PATCH, DELETE

/api/payments              GET, POST
/api/payments/[id]         GET, PATCH, DELETE

/api/fonts/heebo-hebrew    GET  — serves font binary for PDF renderer
/api/fonts/heebo-latin     GET
```

File uploads store to `public/uploads/<model>/<id>/` and return a relative URL. No external storage.

---

## Page Routes (app router)

```
app/
├── layout.tsx                  lang="he" dir="rtl", dark, Heebo font
├── page.tsx                    redirect → /dashboard
├── login/page.tsx              login form
│
└── (crm)/
    ├── layout.tsx              Sidebar + Header + <main>
    ├── dashboard/page.tsx      KPI cards, lead pipeline, active projects, upcoming tasks
    ├── leads/
    │   ├── page.tsx            LeadsTable + LeadsKanban toggle, filters
    │   └── [id]/page.tsx       LeadDetail (tabs: details / notes / meetings / documents / tasks)
    ├── clients/
    │   ├── page.tsx            ClientsTable, sortable columns, financial summary
    │   └── [id]/page.tsx       ClientDetail (tabs: overview / projects / quotes / payments / tasks / files / meetings)
    ├── projects/
    │   ├── page.tsx            ProjectsTable with progress bars, sort
    │   └── [id]/page.tsx       ProjectDetail (tabs: details / milestones / financials / files / tasks)
    ├── quotes/
    │   ├── page.tsx            QuotesTable, expiration alerts (amber 7d / red expired)
    │   └── [id]/page.tsx       QuoteCalculator + PDFExportButton
    ├── catalog/page.tsx        Inline-editable CatalogTable, SKU search, CSV import
    ├── employees/page.tsx      EmployeesTable + EmployeeForm
    ├── suppliers/page.tsx      SuppliersTable + SupplierForm
    ├── tasks/page.tsx          TasksList, priority/status filters, click-to-cycle status
    ├── calendar/page.tsx       Monthly grid, color-coded events, day-detail panel
    ├── finance/page.tsx        KPI cards, 12-month Recharts bar chart, top clients, recent payments
    ├── payments/page.tsx       Global payments list + create form
    ├── invoices/page.tsx       InvoicesTable + InvoiceForm
    └── settings/page.tsx       Tabs: company info / editable lists / employees / stats / recycle bin
```

---

## Component Inventory

```
components/
├── layout/
│   ├── Sidebar.tsx             RTL fixed sidebar, 14 nav items, company name + logo from localStorage
│   ├── Header.tsx              GlobalSearch (debounced 250ms, min 2 chars), notification bell + dropdown
│   ├── PageHeader.tsx          Title + breadcrumb + action buttons slot
│   └── FloatingActionButton.tsx  Mobile FAB
│
├── ui/  (RTL-first primitives — no external lib)
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   └── Tabs.tsx
│
├── shared/
│   ├── StatusBadge.tsx         Colored badge for lead/project/quote/task status
│   ├── EmptyState.tsx
│   └── ConfirmModal.tsx
│
├── leads/
│   ├── LeadsTable.tsx          Sortable table, inline status dropdown
│   ├── LeadsKanban.tsx         Kanban by status
│   ├── LeadForm.tsx            Create/edit (React Hook Form + Zod)
│   ├── LeadDetail.tsx          Tabbed detail, notes log, meetings, documents, tasks, convert button
│   ├── ConvertLeadButton.tsx   1-click Lead → Client
│   └── NotesList.tsx           Timestamped notes log
│
├── clients/
│   ├── ClientsTable.tsx        Sortable, financial summary columns
│   ├── ClientForm.tsx
│   ├── ClientDetail.tsx        5+ tabs, payment modal, inline payment registration
│   └── FinancialSummary.tsx    totalContracts / totalPaid / balance
│
├── projects/
│   ├── ProjectsTable.tsx       Progress bars, sort
│   ├── ProjectForm.tsx
│   ├── ProjectDetail.tsx       Milestone timeline, financials tab, file uploads, overdue detection
│   └── MilestoneTimeline.tsx   Click-to-cycle status, add milestones, progress bar
│
└── quotes/
    ├── QuotesTable.tsx
    ├── QuoteCalculator.tsx     Inline-editable rows, dim1×dim2×price, catalog SKU autocomplete, VAT
    ├── QuotePDF.tsx            @react-pdf/renderer document template
    └── PDFExportButton.tsx     Lazy-loads PDF lib to avoid SSR crash
```

---

## Key Library Files (`lib/`)

### `lib/calculations.ts`
All financial math. Import from here — do not reimplement inline.

```ts
// dim1 in meters, dim2 in centimeters → converts to m²
calcLinePrice(item)        // d1 × (d2/100) × unitPrice
calcElementCost(item)      // materialsCost + transportCost + laborCost
calcProfitPercent(linePrice, elementCost)  // (line - cost) / line × 100

calcQuoteSummary(items, discount):
  subtotal       = Σ calcLinePrice
  totalBeforeVAT = max(0, subtotal − discount)
  vat            = totalBeforeVAT × 0.17
  totalWithVAT   = totalBeforeVAT + vat

calcClientFinancials(contractValues[], payments[]):
  totalContracts, totalPaid, balance = totalContracts − totalPaid
```

### `lib/prisma.ts`
PrismaClient singleton (global cache prevents multiple instances in dev hot-reload).

### `lib/converters.ts`
Lead → Client field mapping helper used in the convert API route.

### `lib/utils.ts`
`cn(...classes)` (clsx + tailwind-merge), `formatCurrency(n)`, `formatDate(d)` with Hebrew locale.

### `lib/notify.ts`
Fire-and-forget `notify(message, type?, relatedEntity?)` — writes a `Notification` row, swallows errors. Wired in: lead conversion, quote status APPROVED/REJECTED, payment creation, milestone completion.

### `lib/useSettingsLists.ts`
React hook that reads `crm-settings-lists` from `localStorage` and returns parsed lists (`workTypes`, `cities`, `paymentMethods`, `projectTypes`, `supplierCategories`). Used in forms as `<datalist>` options.

---

## Types (`types/index.ts`)

Re-exports all Prisma types. Extends two types with migration-added fields (until Prisma client regenerates):
```ts
export type Client = PrismaClient & { mailingAddress?: string | null; deletedAt?: Date | null }
export type Lead   = PrismaLead   & { deletedAt?: Date | null }
```

**Status const maps** (string unions replacing enums):
- `LEAD_STATUS`, `LEAD_STATUS_LABELS`, `LEAD_STATUS_COLORS`
- `PROJECT_STATUS_LABELS`, `PROJECT_STATUS_COLORS`
- `QUOTE_STATUS_LABELS`
- `TASK_STATUS_LABELS`
- `PRIORITY_LABELS`, `PRIORITY_COLORS`
- `LEAD_SOURCE_LABELS`, `CLIENT_TYPE_LABELS`, `URGENCY_LABELS`

**WithRelations composite types:**
```ts
LeadWithRelations    = Lead & { notes, meetings, files, tasks, client? }
ClientWithRelations  = Client & { projects, quotes, invoices, files, tasks }
ProjectWithRelations = Project & { client, milestones, quotes, payments, tasks }
QuoteWithRelations   = Quote & { client, project?, items: (QuoteItem & { catalogItem? })[] }
```

**API wrapper:**
```ts
type ApiResponse<T> = { data?: T; error?: string }
```

---

## Settings Persistence

Settings are **localStorage-only** — no database model.

| Key | Contents |
|---|---|
| `crm-settings-company` | `{ name, subtitle, phone, email, address, vatNumber }` + logo |
| `crm-settings-logo` | base64 data URL |
| `crm-settings-lists` | `{ workTypes[], leadSources[], cities[], paymentMethods[], projectTypes[], supplierCategories[] }` |

The settings page fires `window.dispatchEvent(new Event('crm-settings-changed'))` on save. `Sidebar.tsx` listens to update the company name/logo in the header.

Tab persistence (active tab index) is stored per-page in `localStorage`:
- `crm-tab-lead-{id}` — LeadDetail
- `crm-tab-client-{id}` — ClientDetail

---

## PDF Export

`@react-pdf/renderer` cannot run server-side. Pattern used in `PDFExportButton.tsx`:
```ts
// Inside useEffect or click handler only — never at module level
const [{ pdf }, { QuotePDFDocument }] = await Promise.all([
  import('@react-pdf/renderer'),
  import('./QuotePDF'),
])
```
Fonts served from `/api/fonts/heebo-hebrew` and `/api/fonts/heebo-latin` (binary route handlers). The PDF save-to-client-documents flow calls `/api/clients/[id]/files` with the generated blob.

---

## Notifications

`Header.tsx` polls `GET /api/notifications` on mount (unread count badge on bell icon). Opening the bell loads the full list. Supports:
- `PATCH /api/notifications?id=<id>` — mark one read
- `PATCH /api/notifications?all=true` — mark all read

---

## Global Search

`GET /api/search?q=<query>` — searches `Lead.fullName/primaryPhone`, `Client.name/phones`, `Project.name`. Returns `{ type, id, name, subtitle, href }[]`. Minimum 2 characters; debounced 250ms in `Header.tsx`. Results open a dropdown overlay.

---

## Styling Conventions

- **Direction:** `app/layout.tsx` sets `<html lang="he" dir="rtl">` — RTL is global and unconditional.
- **Dark palette:** `bg-gray-900` base → `bg-gray-800` cards → `bg-gray-700` inputs.
- **Accent:** blue `#3B82F6` active/CTA, purple `#8B5CF6` secondary.
- **Logical properties:** use `ps-`, `pe-`, `ms-`, `me-` instead of `pl-`/`pr-` when direction matters.
- **Hover-reveal actions:** `opacity-0 group-hover:opacity-100` with `group` on the parent container.
- **Inline status dropdowns:** `openStatusId` state + `useRef` + `useEffect` outside-click handler pattern.
- **No external component libraries** — only `components/ui/` primitives.

---

## Key Architectural Decisions

| Decision | Reason |
|---|---|
| No Prisma enums | SQLite does not support them — use `String` fields + `as const` maps in `types/index.ts` |
| Prisma 5.22, not 7.x | v7 requires driver adapters for SQLite |
| No Zustand stores in use | Components use local `useState` + `fetch` — simpler; Zustand is installed but unused |
| No test suite | TypeScript (`npx tsc --noEmit`) is the primary correctness check |
| Server-rendered detail pages call Prisma directly | Avoids an extra API hop for pages that don't need client interactivity on load |
| `deletedAt` soft-delete on Lead + Client | Recycle bin at `/api/recycle-bin` — restore via `PATCH {id, type}` |
| `public/uploads/` for files | Zero-config local storage; relative URL stored in DB |
| Settings in localStorage | Avoids a Settings DB model for simple key-value company config |

---

## Prisma Dev Notes

- After running `prisma migrate dev`, regenerated types only take effect after restarting the dev server (Windows holds `query_engine-windows.dll.node` open).
- `mailingAddress` on Client and `deletedAt` on Lead/Client were added via migrations — types are live but `types/index.ts` extends them manually as a fallback until next restart.
- Seed: `npm run seed` uses `jiti` to transpile `prisma/seed.ts` at runtime.
