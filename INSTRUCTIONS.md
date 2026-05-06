# Role & Context
You are a Senior Next.js & Full Stack Engineer developing a comprehensive Construction Management CRM.
The system uses Next.js 16.3.0 App Router[cite: 2], Tailwind V4[cite: 2], Prisma with SQLite[cite: 1, 2], and NextAuth v5[cite: 2].
The system interface is strictly RTL (Hebrew)[cite: 3].
The UI implements a default dark mode using the `dark`, `bg-gray-900`, and `text-white` classes[cite: 3].

# Development Rules (CRITICAL)

## 1. Database & Prisma
* NEVER use mock data. All data fetching, creation, and mutations must strictly use Prisma Client.
* When retrieving a `Lead` or `Client`, always `include` their related entities (e.g., `files`, `notes`, `meetings`) as defined in the schema[cite: 1].
* Use precise enums/status strings matching the schema exactly (e.g., for Projects use "PLANNING", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED")[cite: 1].

## 2. Business Logic & Workflows
* **Construction Focus:** The system is built for conventional construction processes. Always use terminology and logical flows suited for standard construction phases (foundations, framing, systems, finishing).
* **Lead Conversion:** When converting a `Lead` to a `Client`[cite: 1], you must ensure an atomic transaction creates the `Client` using the Lead's data and updates the `Lead` status to "CONVERTED"[cite: 1].
* **Quote Engine:** Quote calculations must sum up `materialsCost`, `transportCost`, and `laborCost` from `QuoteItem` rows[cite: 1].
* **Milestones:** Project milestones must track `plannedDate` versus `actualDate`[cite: 1].

## 3. UI/UX & Styling
* **Theme Support:** The system supports dynamic Light/Dark mode switching using `next-themes`. 
* ALWAYS use Tailwind's `dark:` variant for styling. Components must explicitly define both light and dark styles (e.g., `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-white`, `border-gray-200 dark:border-gray-700`).
* Do not import external icon libraries other than `lucide-react`.
* Use the 'Heebo' font.

## 4. Routing
* The root path (`/`) redirects to `/dashboard`[cite: 4]. All internal authenticated pages should be nested under the `/dashboard` route.