'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, FolderKanban, CheckSquare, TrendingUp,
  AlertTriangle, ArrowLeft, Clock, DollarSign,
  UserCheck, Phone, StickyNote, RefreshCw, ListTodo, Activity, Cpu,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate, timeAgo } from '@/lib/utils'
import { LEAD_STATUS_LABELS } from '@/types'
import { CRM_SETTING_KEYS } from '@/lib/crm-settings'

type ActivityEntry = {
  id: string
  action: string
  description: string
  createdAt: string
  employee: { id: string; name: string } | null
  lead: { id: string; fullName: string } | null
  client: { id: string; name: string } | null
}

type FinanceSummary = {
  totalRevenue: number
  totalContracts: number
  outstanding: number
}

type DashboardData = {
  leads: {
    total: number
    byStatus: Record<string, number>
  }
  projects: {
    active: number
    totalContractValue: number
    recent: Array<{
      id: string
      name: string
      status: string
      contractValue: number
      progressPercent: number
      client: { name: string }
    }>
  }
  tasks: {
    pending: number
    overdue: number
    upcoming: Array<{
      id: string
      title: string
      dueDate: string
      priority: string
      client: { name: string } | null
      project: { name: string } | null
    }>
  }
  revenue: {
    thisMonth: number
    paymentCount: number
    monthly: { month: string; amount: number }[]
  }
  recentLeads: Array<{
    id: string
    fullName: string
    status: string
    primaryPhone: string
    city: string | null
    createdAt: string
  }>
  employees: {
    active: number
  }
  recentActivity: ActivityEntry[]
}

const LEAD_PIPELINE_ORDER = ['NEW', 'CONTACTED', 'MEETING_SCHEDULED', 'QUOTE_SENT', 'WON', 'LOST']
const PIPELINE_COLORS: Record<string, string> = {
  NEW: 'bg-gray-500',
  CONTACTED: 'bg-blue-500',
  MEETING_SCHEDULED: 'bg-purple-500',
  QUOTE_SENT: 'bg-yellow-500',
  WON: 'bg-green-500',
  LOST: 'bg-red-400',
}

const PROJECT_STATUS_LABEL: Record<string, string> = {
  PLANNING: 'תכנון',
  ACTIVE: 'פעיל',
  PAUSED: 'מושהה',
  COMPLETED: 'הושלם',
  CANCELLED: 'בוטל',
}
const PROJECT_STATUS_COLOR: Record<string, string> = {
  PLANNING: 'text-blue-400',
  ACTIVE: 'text-green-400',
  PAUSED: 'text-yellow-400',
  COMPLETED: 'text-gray-400',
}

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: 'text-red-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-gray-400',
}

const ACTIVITY_ACTION_LABEL: Record<string, string> = {
  NOTE: 'הערה',
  CALL: 'שיחה',
  STATUS_CHANGE: 'שינוי סטטוס',
  TASK_CREATED: 'משימה נוצרה',
  SYSTEM: 'מערכת',
  OTHER: 'אחר',
}

const ACTIVITY_ACTION_COLOR: Record<string, string> = {
  NOTE: 'bg-blue-500/20 text-blue-300',
  CALL: 'bg-green-500/20 text-green-300',
  STATUS_CHANGE: 'bg-purple-500/20 text-purple-300',
  TASK_CREATED: 'bg-yellow-500/20 text-yellow-300',
  SYSTEM: 'bg-gray-500/20 text-gray-400',
  OTHER: 'bg-gray-500/20 text-gray-400',
}

function ActivityActionIcon({ action }: { action: string }) {
  const cls = 'shrink-0'
  switch (action) {
    case 'NOTE': return <StickyNote size={14} className={cls} />
    case 'CALL': return <Phone size={14} className={cls} />
    case 'STATUS_CHANGE': return <RefreshCw size={14} className={cls} />
    case 'TASK_CREATED': return <ListTodo size={14} className={cls} />
    case 'SYSTEM': return <Cpu size={14} className={cls} />
    default: return <Activity size={14} className={cls} />
  }
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  subColor,
  href,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  subColor?: string
  href: string
  color: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-gray-600 transition-colors cursor-pointer">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && (
              <p className={`text-xs mt-1 ${subColor ?? 'text-gray-500'}`}>{sub}</p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

function RecentActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-center text-gray-600 text-sm py-6">אין פעילות אחרונה</p>
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const colorCls = ACTIVITY_ACTION_COLOR[entry.action] ?? ACTIVITY_ACTION_COLOR.OTHER
        const entityHref = entry.lead
          ? `/leads/${entry.lead.id}`
          : entry.client
          ? `/clients/${entry.client.id}`
          : null
        const entityName = entry.lead?.fullName ?? entry.client?.name ?? null

        return (
          <div key={entry.id} className="flex items-start gap-2.5 py-1.5">
            <span className={`mt-0.5 p-1.5 rounded-lg ${colorCls}`}>
              <ActivityActionIcon action={entry.action} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{entry.description}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {entry.employee && (
                  <span className="text-xs text-gray-500">{entry.employee.name}</span>
                )}
                {entry.employee && entityName && (
                  <span className="text-gray-700 text-xs">·</span>
                )}
                {entityName && entityHref ? (
                  <Link href={entityHref} className="text-xs text-blue-400 hover:text-blue-300 truncate">
                    {entityName}
                  </Link>
                ) : entityName ? (
                  <span className="text-xs text-gray-500 truncate">{entityName}</span>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 text-left">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${colorCls}`}>
                {ACTIVITY_ACTION_LABEL[entry.action] ?? entry.action}
              </span>
              <p className="text-[10px] text-gray-600 mt-0.5 text-left">{timeAgo(entry.createdAt)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [finData, setFinData] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then((r) => r.json()),
      fetch('/api/finance').then((r) => r.json()).catch(() => null),
      fetch('/api/settings').then((r) => r.json()).catch(() => null),
    ]).then(([dash, fin, settings]) => {
      setData(dash.data)
      if (fin?.data) {
        setFinData({
          totalRevenue: fin.data.totalRevenue,
          totalContracts: fin.data.totalContracts,
          outstanding: fin.data.outstanding,
        })
      }
      const company = settings?.data?.[CRM_SETTING_KEYS.company]
      if (company && typeof company === 'object' && company !== null && 'name' in company) {
        const n = (company as { name?: unknown }).name
        if (typeof n === 'string') setCompanyName(n)
      }
      setLoading(false)
    })
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeLeads = data.leads.total - (data.leads.byStatus['WON'] ?? 0) - (data.leads.byStatus['LOST'] ?? 0) - (data.leads.byStatus['CONVERTED'] ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">שלום{companyName ? `, ${companyName}` : ''} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4
">
        <KPICard
          icon={Users}
          label="לידים פעילים"
          value={activeLeads}
          sub={`${data.leads.total} סה"כ`}
          href="/leads"
          color="bg-blue-600"
        />
        <KPICard
          icon={UserCheck}
          label="עובדים פעילים"
          value={data.employees.active}
          href="/employees"
          color="bg-indigo-600"
        />
        <KPICard
          icon={FolderKanban}
          label="פרויקטים פעילים"
          value={data.projects.active}
          sub={`שווי: ${formatCurrency(data.projects.totalContractValue)}`}
          href="/projects"
          color="bg-purple-600"
        />
        <KPICard
          icon={CheckSquare}
          label="משימות פתוחות"
          value={data.tasks.pending}
          sub={data.tasks.overdue > 0 ? `${data.tasks.overdue} באיחור` : 'ללא איחורים'}
          subColor={data.tasks.overdue > 0 ? 'text-red-400' : 'text-green-400'}
          href="/tasks"
          color="bg-yellow-600"
        />
        <KPICard
          icon={TrendingUp}
          label="הכנסות החודש"
          value={formatCurrency(data.revenue.thisMonth)}
          sub={`${data.revenue.paymentCount} תשלומים`}
          href="/clients"
          color="bg-green-600"
        />
      </div>

      {/* Financial summary row */}
      {finData && (
        <Link href="/finance">
          <Card className="hover:border-gray-600 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-green-400" />
                <span className="text-xs font-semibold text-gray-400">סיכום פיננסי</span>
              </div>
              <span className="text-xs text-blue-400 flex items-center gap-0.5">
                לדוח מלא <ArrowLeft size={11} />
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
>
              <div>
                <p className="text-[11px] text-gray-500 mb-0.5">סה&quot;כ חוזים</p>
                <p className="text-base font-bold text-white">{formatCurrency(finData.totalContracts)}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-0.5">סה&quot;כ גבייה</p>
                <p className="text-base font-bold text-green-400">{formatCurrency(finData.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-0.5">יתרה לגבייה</p>
                <p className="text-base font-bold text-yellow-400">{formatCurrency(finData.outstanding)}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-0.5">אחוז גבייה</p>
                <p className="text-base font-bold text-blue-400">
                  {finData.totalContracts > 0
                    ? `${Math.round((finData.totalRevenue / finData.totalContracts) * 100)}%`
                    : '—'}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Revenue chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">הכנסות — 6 חודשים אחרונים</h2>
          <span className="text-xs text-gray-500">כולל מע&quot;מ</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data.revenue.monthly} barSize={28}>
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#d1d5db' }}
              formatter={(v: unknown) => [formatCurrency(Number(v)), 'הכנסות']}
              cursor={{ fill: 'rgba(255,255,255,0.06)' }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {data.revenue.monthly.map((entry, i) => (
                <Cell
                  key={i}
                  fill={i === data.revenue.monthly.length - 1 ? '#3b82f6' : '#4b5563'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
>
        {/* Lead pipeline */}
        <Card className="col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">משפך לידים</h2>
            <Link href="/leads" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              כל הלידים <ArrowLeft size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {LEAD_PIPELINE_ORDER.map((status) => {
              const count = data.leads.byStatus[status] ?? 0
              const pct = data.leads.total > 0 ? (count / data.leads.total) * 100 : 0
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">{LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] ?? status}</span>
                    <span className="text-xs font-semibold text-white">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${PIPELINE_COLORS[status] ?? 'bg-gray-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Active projects */}
        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">פרויקטים פעילים</h2>
            <Link href="/projects" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              כל הפרויקטים <ArrowLeft size={11} />
            </Link>
          </div>
          {data.projects.recent.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-6">אין פרויקטים פעילים</p>
          ) : (
            <div className="space-y-3">
              {data.projects.recent.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors -mx-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <span className={`text-xs ${PROJECT_STATUS_COLOR[p.status] ?? 'text-gray-400'}`}>
                          {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{p.client.name} · {formatCurrency(p.contractValue)}</p>
                    </div>
                    <div className="text-left shrink-0 w-24">
                      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>התקדמות</span>
                        <span>{p.progressPercent}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${p.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
>
        {/* Upcoming tasks */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">משימות קרובות</h2>
            <Link href="/tasks" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              כל המשימות <ArrowLeft size={11} />
            </Link>
          </div>
          {data.tasks.upcoming.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-6">אין משימות קרובות ב-7 ימים</p>
          ) : (
            <div className="space-y-2">
              {data.tasks.upcoming.map((t) => {
                const isOverdue = new Date(t.dueDate) < new Date()
                return (
                  <div key={t.id} className="flex items-center gap-2.5 py-1.5">
                    <Clock size={14} className={isOverdue ? 'text-red-400' : 'text-gray-500'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{t.title}</p>
                      <p className="text-xs text-gray-500">
                        {t.client?.name ?? t.project?.name ?? ''}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                        {formatDate(t.dueDate)}
                      </p>
                      <p className={`text-[10px] text-left ${PRIORITY_COLOR[t.priority] ?? 'text-gray-500'}`}>
                        {t.priority === 'HIGH' ? 'גבוהה' : t.priority === 'LOW' ? 'נמוכה' : 'בינונית'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Recent leads */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">לידים אחרונים</h2>
            <Link href="/leads" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
              כל הלידים <ArrowLeft size={11} />
            </Link>
          </div>
          {data.recentLeads.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-6">אין לידים</p>
          ) : (
            <div className="space-y-2">
              {data.recentLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`} className="block">
                  <div className="flex items-center gap-2.5 py-1.5 hover:bg-gray-800/30 rounded-lg -mx-1 px-1 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {lead.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{lead.fullName}</p>
                      <p className="text-xs text-gray-500">{lead.primaryPhone}{lead.city ? ` · ${lead.city}` : ''}</p>
                    </div>
                    <div className="shrink-0 text-left">
                      <StatusBadge type="lead" value={lead.status} />
                      <p className="text-[10px] text-gray-600 mt-0.5 text-left">{timeAgo(lead.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">פעילות אחרונה</h2>
          </div>
        </div>
        <RecentActivityFeed entries={data.recentActivity ?? []} />
      </Card>

      {/* Overdue alert */}
      {data.tasks.overdue > 0 && (
        <Link href="/tasks?status=PENDING">
          <Card className="border-red-500/30 bg-red-500/5 hover:border-red-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-red-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {data.tasks.overdue} משימה{data.tasks.overdue !== 1 ? 'ות' : ''} באיחור
                </p>
                <p className="text-xs text-red-400/70">לחץ לצפייה במשימות הבוערות</p>
              </div>
              <ArrowLeft size={16} className="text-red-400 mr-auto" />
            </div>
          </Card>
        </Link>
      )}
    </div>
  )
}
