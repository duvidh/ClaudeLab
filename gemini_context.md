# Gemini Context — Construction CRM

> Auto-generated project context report. Do not edit manually.

---

## 1. Directory Tree

```
construction-crm/
├── app/
│   ├── (crm)/
│   │   ├── calendar/
│   │   │   └── page.tsx
│   │   ├── catalog/
│   │   │   └── page.tsx
│   │   ├── clients/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── employees/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── finance/
│   │   │   └── page.tsx
│   │   ├── invoices/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── leads/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── payments/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── quotes/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── suppliers/
│   │   │   └── page.tsx
│   │   └── tasks/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   └── logout/
│   │   │       └── route.ts
│   │   ├── calendar/
│   │   │   └── route.ts
│   │   ├── catalog/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── clients/
│   │   │   ├── [id]/
│   │   │   │   ├── files/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── payments/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── dashboard/
│   │   │   └── route.ts
│   │   ├── employees/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── finance/
│   │   │   └── route.ts
│   │   ├── fonts/
│   │   │   ├── heebo-hebrew/
│   │   │   │   └── route.ts
│   │   │   └── heebo-latin/
│   │   │       └── route.ts
│   │   ├── invoices/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── leads/
│   │   │   ├── [id]/
│   │   │   │   ├── convert/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── files/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── notes/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── meetings/
│   │   │   └── route.ts
│   │   ├── notifications/
│   │   │   └── route.ts
│   │   ├── payments/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── files/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── milestones/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── payments/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── quotes/
│   │   │   ├── [id]/
│   │   │   │   ├── duplicate/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── items/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   ├── recycle-bin/
│   │   │   └── route.ts
│   │   ├── search/
│   │   │   └── route.ts
│   │   ├── settings/
│   │   │   └── stats/
│   │   │       └── route.ts
│   │   ├── suppliers/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts
│   │   │   └── route.ts
│   │   └── tasks/
│   │       └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   └── page.tsx
├── components/
│   ├── catalog/
│   ├── clients/
│   │   ├── ClientDetail.tsx
│   │   ├── ClientForm.tsx
│   │   ├── ClientsTable.tsx
│   │   └── FinancialSummary.tsx
│   ├── layout/
│   │   ├── FloatingActionButton.tsx
│   │   ├── Header.tsx
│   │   ├── PageHeader.tsx
│   │   └── Sidebar.tsx
│   ├── leads/
│   │   ├── ConvertLeadButton.tsx
│   │   ├── LeadDetail.tsx
│   │   ├── LeadForm.tsx
│   │   ├── LeadsKanban.tsx
│   │   ├── LeadsTable.tsx
│   │   └── NotesList.tsx
│   ├── projects/
│   │   ├── MilestoneTimeline.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── ProjectForm.tsx
│   │   └── ProjectsTable.tsx
│   ├── quotes/
│   │   ├── PDFExportButton.tsx
│   │   ├── QuoteCalculator.tsx
│   │   ├── QuotePDF.tsx
│   │   └── QuotesTable.tsx
│   ├── shared/
│   │   ├── ConfirmModal.tsx
│   │   ├── EmptyState.tsx
│   │   └── StatusBadge.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── DataTable.tsx
│       ├── FormField.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Select.tsx
│       └── Tabs.tsx
├── lib/
│   ├── api-handler.ts
│   ├── calculations.ts
│   ├── converters.ts
│   ├── file-utils.ts
│   ├── notify.ts
│   ├── pdf-utils.ts
│   ├── prisma.ts
│   ├── useSettingsLists.ts
│   └── utils.ts
├── prisma/
│   ├── dev.db
│   ├── migrations/
│   │   ├── 20260428011412_init/
│   │   │   └── migration.sql
│   │   ├── 20260428185947_add_employees/
│   │   │   └── migration.sql
│   │   ├── 20260428190723_add_task_type/
│   │   │   └── migration.sql
│   │   ├── 20260429090812_add_supplier/
│   │   │   └── migration.sql
│   │   ├── 20260429091624_add_client_mailing_address/
│   │   │   └── migration.sql
│   │   ├── 20260429092220_add_soft_delete/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── uploads/
│   │   ├── clients/
│   │   ├── leads/
│   │   └── projects/
│   ├── vercel.svg
│   └── window.svg
├── types/
│   └── index.ts
├── ARCHITECTURE.md
├── CLAUDE.md
├── README.md
├── eslint.config.mjs
├── gemini_context.md
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── proxy.ts
└── tsconfig.json
```

---

## 2. Database Schema (`prisma/schema.prisma`)

**Database:** SQLite (file: `prisma/dev.db`)  
**ORM:** Prisma 5.x  

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── Leads ───────────────────────────────────────────────────────────────────

model Lead {
  id               String    @id @default(cuid())
  fullName         String
  primaryPhone     String
  secondaryPhone   String?
  email            String?
  propertyAddress  String?
  city             String?
  clientType       String    @default("PRIVATE")
  leadSource       String    @default("OTHER")
  assignedRep      String?
  // status: NEW | CONTACTED | MEETING_SCHEDULED | QUOTE_SENT | WON | LOST | CONVERTED
  status           String    @default("NEW")
  workType         String?
  needDescription  String?
  estimatedSize    Float?
  budget           Float?
  desiredStartDate DateTime?
  // urgency: LOW | MEDIUM | HIGH
  urgency          String    @default("MEDIUM")
  buildingPermit   Boolean   @default(false)
  nextMeetingDate  DateTime?
  lossReason       String?
  quoteStatus      String?
  convertedAt      DateTime?
  entryDate        DateTime  @default(now())
  deletedAt        DateTime?

  client   Client?
  notes    LeadNote[]
  meetings Meeting[]
  files    LeadFile[]
  tasks    Task[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model LeadNote {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  content   String
  author    String
  createdAt DateTime @default(now())
}

model LeadFile {
  id        String   @id @default(cuid())
  leadId    String
  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  name      String
  url       String
  mimeType  String?
  createdAt DateTime @default(now())
}

// ─── Clients ─────────────────────────────────────────────────────────────────

model Client {
  id             String    @id @default(cuid())
  name           String
  company        String?
  idNumber       String?
  address        String?
  mailingAddress String?
  city           String?
  phones         String    @default("[]")
  email          String?
  // category: PRIVATE | BUSINESS
  category       String    @default("PRIVATE")
  // status: ACTIVE | INACTIVE
  status         String    @default("ACTIVE")
  joinDate       DateTime  @default(now())
  leadId         String?   @unique
  lead           Lead?     @relation(fields: [leadId], references: [id])
  paymentMethod  String?
  notes          String?
  deletedAt      DateTime?

  projects Project[]
  quotes   Quote[]
  invoices Invoice[]
  meetings Meeting[]
  tasks    Task[]
  files    ClientFile[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ClientFile {
  id        String   @id @default(cuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  name      String
  url       String
  fileType  String?
  createdAt DateTime @default(now())
}

// ─── Meetings (shared: Leads & Clients) ──────────────────────────────────────

model Meeting {
  id        String   @id @default(cuid())
  leadId    String?
  lead      Lead?    @relation(fields: [leadId], references: [id])
  clientId  String?
  client    Client?  @relation(fields: [clientId], references: [id])
  date      DateTime
  type      String
  summary   String?
  createdAt DateTime @default(now())
}

// ─── Projects ────────────────────────────────────────────────────────────────

model Project {
  id              String    @id @default(cuid())
  name            String
  clientId        String
  client          Client    @relation(fields: [clientId], references: [id])
  address         String?
  projectType     String?
  // status: PLANNING | ACTIVE | PAUSED | COMPLETED | CANCELLED
  status          String    @default("PLANNING")
  projectManager  String?
  fieldTeam       String?
  startDate       DateTime?
  plannedEndDate  DateTime?
  actualEndDate   DateTime?
  progressPercent Int       @default(0)
  contractValue   Float     @default(0)
  notes           String?

  milestones Milestone[]
  quotes     Quote[]
  payments   Payment[]
  tasks      Task[]
  files      ProjectFile[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Milestone {
  id          String    @id @default(cuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name        String
  plannedDate DateTime?
  actualDate  DateTime?
  // status: PENDING | IN_PROGRESS | DONE
  status      String    @default("PENDING")
  order       Int       @default(0)
}

model ProjectFile {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String
  url       String
  fileType  String?
  createdAt DateTime @default(now())
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

model Quote {
  id           String    @id @default(cuid())
  quoteNumber  String    @unique
  clientId     String
  client       Client    @relation(fields: [clientId], references: [id])
  projectId    String?
  project      Project?  @relation(fields: [projectId], references: [id])
  date         DateTime  @default(now())
  validUntil   DateTime?
  // status: DRAFT | SENT | APPROVED | REJECTED | EXPIRED
  status       String    @default("DRAFT")
  version      Int       @default(1)
  discount     Float     @default(0)
  paymentTerms String?
  notes        String?

  items QuoteItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model QuoteItem {
  id             String       @id @default(cuid())
  quoteId        String
  quote          Quote        @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  sequenceNumber Int
  catalogItemId  String?
  catalogItem    CatalogItem? @relation(fields: [catalogItemId], references: [id])
  productName    String
  category       String?
  dimension1     Float?
  dimension2     Float?
  unit           String?
  unitPrice      Float        @default(0)
  materialsCost  Float        @default(0)
  transportCost  Float        @default(0)
  laborCost      Float        @default(0)
  notes          String?
}

// ─── Materials Catalog ───────────────────────────────────────────────────────

model CatalogItem {
  id         String      @id @default(cuid())
  sku        String      @unique
  name       String
  category   String?
  unit       String?
  salePrice  Float       @default(0)
  selfCost   Float       @default(0)
  supplier   String?
  stock      Float?
  isActive   Boolean     @default(true)
  quoteItems QuoteItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─── Payments & Invoices ─────────────────────────────────────────────────────

model Payment {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  clientId  String?
  amount    Float
  date      DateTime @default(now())
  method    String?
  reference String?
  notes     String?
  invoiceId String?
  invoice   Invoice? @relation(fields: [invoiceId], references: [id])
  createdAt DateTime @default(now())
}

model Invoice {
  id        String    @id @default(cuid())
  clientId  String
  client    Client    @relation(fields: [clientId], references: [id])
  number    String    @unique
  amount    Float
  date      DateTime  @default(now())
  dueDate   DateTime?
  isPaid    Boolean   @default(false)
  pdfUrl    String?
  payments  Payment[]
  createdAt DateTime  @default(now())
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  assignedTo  String?
  dueDate     DateTime?
  // status: PENDING | IN_PROGRESS | DONE
  status      String    @default("PENDING")
  // priority: LOW | MEDIUM | HIGH
  priority    String    @default("MEDIUM")
  // taskType: TASK | CALL | MEETING | EMAIL | FOLLOWUP | ADMINISTRATIVE | OTHER
  taskType    String    @default("TASK")
  leadId      String?
  lead        Lead?     @relation(fields: [leadId], references: [id])
  clientId    String?
  client      Client?   @relation(fields: [clientId], references: [id])
  projectId   String?
  project     Project?  @relation(fields: [projectId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// ─── Employees ───────────────────────────────────────────────────────────────

model Employee {
  id         String    @id @default(cuid())
  name       String
  // role: INTERNAL | EXTERNAL
  role       String    @default("INTERNAL")
  position   String?
  // wageType: MONTHLY | HOURLY | PER_PROJECT
  wageType   String    @default("MONTHLY")
  wageAmount Float     @default(0)
  // status: ACTIVE | INACTIVE
  status     String    @default("ACTIVE")
  startDate  DateTime?
  phone      String?
  email      String?
  notes      String?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

model Supplier {
  id          String   @id @default(cuid())
  name        String
  contactName String?
  phone       String?
  email       String?
  address     String?
  category    String?
  notes       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── Notifications ───────────────────────────────────────────────────────────

model Notification {
  id            String   @id @default(cuid())
  message       String
  type          String   @default("info")
  isRead        Boolean  @default(false)
  relatedEntity String?
  createdAt     DateTime @default(now())
}
```

### Migration History

| Migration | Description |
|---|---|
| `20260428011412_init` | Creates all core tables: Lead, LeadNote, LeadFile, Client, ClientFile, Meeting, Project, Milestone, ProjectFile, Quote, QuoteItem, CatalogItem, Payment, Invoice, Task, Notification |
| `20260428185947_add_employees` | Adds `Employee` table |
| `20260428190723_add_task_type` | Adds `taskType` field to `Task` |
| `20260429090812_add_supplier` | Adds `Supplier` table |
| `20260429091624_add_client_mailing_address` | Adds `mailingAddress` field to `Client` |
| `20260429092220_add_soft_delete` | Adds `deletedAt` soft-delete field to `Lead` and `Client` |

---

## 3. Package Manager File (`package.json`)

```json
{
  "name": "construction-crm",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "seed": "node --import=jiti/register prisma/seed.ts"
  },
  "prisma": {
    "seed": "node --import=jiti/register prisma/seed.ts"
  },
  "dependencies": {
    "@fontsource/heebo": "^5.2.8",
    "@prisma/client": "^5.22.0",
    "@react-pdf/renderer": "^4.5.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.11.0",
    "next": "16.2.4",
    "prisma": "^5.22.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.8.1"
  },
  "devDependencies": {
    "@react-pdf/types": "^2.11.1",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "postcss": "^8.5.13",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Key dependencies:**
- **Framework:** Next.js 16.2.4 (App Router, Turbopack)
- **Runtime:** React 19 / React DOM 19
- **Database ORM:** Prisma 5.22 with SQLite
- **UI:** Tailwind CSS v4, Lucide React icons, Recharts (charts)
- **PDF generation:** `@react-pdf/renderer` v4
- **Font:** `@fontsource/heebo` (Hebrew-compatible)
- **Utilities:** `clsx` (class merging)

---

## 4. Data Flow & Routing Structure

### Architecture Overview

This is a **full-stack Next.js App Router** application — the frontend and backend live in the same codebase. There is no external API server; all data access happens through Next.js Route Handlers backed by a local **SQLite** database accessed via **Prisma ORM**.

### Authentication Flow

```
Browser → POST /api/auth/login  →  validates ADMIN_PASSWORD env var
                                →  sets HttpOnly session cookie (AUTH_SECRET)
Browser → POST /api/auth/logout →  clears cookie
app/(crm)/layout.tsx            →  reads cookie; redirects to /login if absent
```

Authentication is a simple single-password guard (no user accounts). The `(crm)` route group layout enforces the auth check on every CRM page.

### UI → API Data Flow

All UI pages are **Client Components** that fetch data via `fetch()` calls to the local `/api/*` Route Handlers. The pattern is:

```
Page Component (Client)
  └── fetch("/api/<resource>")          ← list / detail
        └── Route Handler (Server)
              └── prisma.<model>.*()    ← SQLite via Prisma
                    └── dev.db
```

Mutations (create, update, delete) follow the same pattern using POST / PATCH / DELETE methods. Responses are plain JSON.

### Core Business Entity Flow

```
Lead (inquiry)
  │
  ├── LeadNotes, LeadFiles, Meetings, Tasks
  │
  └──[POST /api/leads/[id]/convert]──► Client (won customer)
                                          │
                                          ├── ClientFiles, Meetings, Tasks
                                          │
                                          ├──► Quote (line-item pricing)
                                          │       └── QuoteItems (linked to CatalogItems)
                                          │             └──[PDF export via @react-pdf/renderer]
                                          │
                                          └──► Project (active work)
                                                  │
                                                  ├── Milestones (timeline)
                                                  ├── ProjectFiles
                                                  ├── Payments  ──► Invoice
                                                  └── Tasks
```

### Route Groups & Layouts

| Group | Path prefix | Purpose |
|---|---|---|
| Root layout | `/` | Global HTML shell, fonts |
| `(crm)` group | `/dashboard`, `/leads`, `/clients`, etc. | Auth-guarded CRM shell with Sidebar + Header |
| `login` | `/login` | Public login page |
| `api` | `/api/*` | All REST-style JSON endpoints |

### API Structure Summary

Each major entity has a standard REST surface:

| Route | Methods | Notes |
|---|---|---|
| `/api/leads` | GET, POST | List with filters; create |
| `/api/leads/[id]` | GET, PATCH, DELETE | Soft-delete via `deletedAt` |
| `/api/leads/[id]/convert` | POST | Converts lead → client, creates Client record |
| `/api/leads/[id]/notes` | GET, POST | Lead notes CRUD |
| `/api/leads/[id]/files` | GET, POST | File uploads (multipart → `public/uploads/leads/`) |
| `/api/clients/[id]` | GET, PATCH, DELETE | Soft-delete |
| `/api/clients/[id]/files` | GET, POST | File uploads |
| `/api/clients/[id]/payments` | GET | Payments linked to client's projects |
| `/api/projects/[id]/milestones` | GET, POST | Milestone management |
| `/api/projects/[id]/payments` | GET | Project payment history |
| `/api/quotes/[id]/items` | POST | Replace all line items on a quote |
| `/api/quotes/[id]/duplicate` | POST | Clone a quote (new version) |
| `/api/dashboard` | GET | Aggregated KPI stats |
| `/api/finance` | GET | Financial summary (revenue, costs, margins) |
| `/api/calendar` | GET | Upcoming meetings & tasks |
| `/api/search` | GET | Global cross-entity search |
| `/api/recycle-bin` | GET | Lists soft-deleted leads & clients |
| `/api/notifications` | GET, PATCH | In-app notification feed |
| `/api/fonts/heebo-*` | GET | Serves Heebo font bytes for PDF rendering |

### File Storage

Uploaded files are stored directly on disk under `public/uploads/<entity>/<id>/` and served as static assets. No cloud storage is used.

### PDF Generation

Quote PDFs are generated **client-side** using `@react-pdf/renderer`. The `QuotePDF.tsx` component renders a React tree to a PDF blob in the browser, then triggers a download. The Heebo font (Hebrew support) is fetched at render time from `/api/fonts/heebo-*`.
