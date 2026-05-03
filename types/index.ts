// Import and re-export Prisma types
import type {
  Lead as PrismaLead,
  LeadNote,
  LeadFile,
  Client as PrismaClient,
  ClientFile,
  Meeting,
  Project,
  Milestone,
  ProjectFile,
  Quote,
  QuoteItem,
  CatalogItem,
  Payment,
  Invoice,
  Task,
  Notification,
} from '@prisma/client'

// Extend Client with fields added via migration (regenerated after dev server restart)
export type Client = PrismaClient & { mailingAddress?: string | null; deletedAt?: Date | null }
// Extend Lead with deletedAt added via migration
export type Lead = PrismaLead & { deletedAt?: Date | null }

export type {
  LeadNote,
  LeadFile,
  ClientFile,
  Meeting,
  Project,
  Milestone,
  ProjectFile,
  Quote,
  QuoteItem,
  CatalogItem,
  Payment,
  Invoice,
  Task,
  Notification,
}

// ─── App-level string unions (replacing SQLite-incompatible Prisma enums) ────

export const LEAD_STATUS = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  MEETING_SCHEDULED: 'MEETING_SCHEDULED',
  QUOTE_SENT: 'QUOTE_SENT',
  WON: 'WON',
  LOST: 'LOST',
  CONVERTED: 'CONVERTED',
} as const
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS]

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'חדש',
  CONTACTED: 'נוצר קשר',
  MEETING_SCHEDULED: 'פגישה נקבעה',
  QUOTE_SENT: 'הצעת מחיר נשלחה',
  WON: 'זכינו',
  LOST: 'אבד',
  CONVERTED: 'הומר ללקוח',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-500/20 text-blue-300',
  CONTACTED: 'bg-yellow-500/20 text-yellow-300',
  MEETING_SCHEDULED: 'bg-purple-500/20 text-purple-300',
  QUOTE_SENT: 'bg-orange-500/20 text-orange-300',
  WON: 'bg-green-500/20 text-green-300',
  LOST: 'bg-red-500/20 text-red-300',
  CONVERTED: 'bg-teal-500/20 text-teal-300',
}

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'אתר אינטרנט',
  REFERRAL: 'המלצה',
  FACEBOOK: 'פייסבוק',
  GOOGLE: 'גוגל',
  PHONE: 'טלפון',
  OTHER: 'אחר',
}

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  PRIVATE: 'פרטי',
  BUSINESS: 'עסקי',
}

export const URGENCY_LABELS: Record<string, string> = {
  LOW: 'נמוכה',
  MEDIUM: 'בינונית',
  HIGH: 'גבוהה',
}

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: 'תכנון',
  ACTIVE: 'פעיל',
  PAUSED: 'מושהה',
  COMPLETED: 'הושלם',
  CANCELLED: 'בוטל',
}

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: 'bg-blue-500/20 text-blue-300',
  ACTIVE: 'bg-green-500/20 text-green-300',
  PAUSED: 'bg-yellow-500/20 text-yellow-300',
  COMPLETED: 'bg-teal-500/20 text-teal-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'טיוטה',
  SENT: 'נשלחה',
  APPROVED: 'אושרה',
  REJECTED: 'נדחתה',
  EXPIRED: 'פג תוקף',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: 'ממתין',
  IN_PROGRESS: 'בביצוע',
  DONE: 'הושלם',
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'נמוכה',
  MEDIUM: 'בינונית',
  HIGH: 'גבוהה',
}

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-500/20 text-gray-300',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300',
  HIGH: 'bg-red-500/20 text-red-300',
}

// ─── API response types ───────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data?: T
  error?: string
}

export type LeadWithRelations = Lead & {
  notes: LeadNote[]
  meetings: Meeting[]
  files: LeadFile[]
  tasks: Task[]
  client?: Client | null
  assignedTo?: { id: string; name: string; position: string | null } | null
}

export type ClientWithRelations = Client & {
  projects: Project[]
  quotes: Quote[]
  invoices: Invoice[]
  files: ClientFile[]
  tasks: Task[]
}

export type ProjectWithRelations = Project & {
  client: Client
  milestones: Milestone[]
  quotes: Quote[]
  payments: Payment[]
  tasks: Task[]
}

export type QuoteWithRelations = Quote & {
  client: Client
  project?: Project | null
  items: (QuoteItem & { catalogItem?: CatalogItem | null })[]
}
