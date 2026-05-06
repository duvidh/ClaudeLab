'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Wallet, FolderOpen, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

type FinanceSummary = {
  totalRevenue: number
  totalContracts: number
  outstanding: number
  activeProjects: number
  ytdRevenue: number
  monthlyData: { month: string; amount: number }[]
  recentPayments: {
    id: string
    amount: number
    date: string
    method: string | null
    reference: string | null
    projectName: string
    clientId: string
  }[]
  topClients: { id: string; name: string; totalPaid: number }[]
}

function fmt(n: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('he-IL')
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ElementType
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </Card>
  )
}

// ─── Custom tooltip for chart ──────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm shadow-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-gray-900 dark:text-white font-semibold">{fmt(payload[0].value)}</p>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [data, setData] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/finance')
      .then((r) => r.json())
      .then((j) => { setData(j.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-gray-400 text-center py-16">שגיאה בטעינת נתונים</div>
  }

  const collectionRate = data.totalContracts > 0
    ? Math.round((data.totalRevenue / data.totalContracts) * 100)
    : 0

  return (
    <div>
      <PageHeader title="כספים ופיננסים" subtitle="סיכום הכנסות, גבייה ותשלומים" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="סה״כ הכנסות"
          value={fmt(data.totalRevenue)}
          sub={`שנת ${new Date().getFullYear()}: ${fmt(data.ytdRevenue)}`}
          color="bg-green-500/10 text-green-400"
          icon={TrendingUp}
        />
        <StatCard
          label="יתרה לגבייה"
          value={fmt(data.outstanding)}
          sub={`${collectionRate}% נגבה מסך החוזים`}
          color="bg-yellow-500/10 text-yellow-400"
          icon={Clock}
        />
        <StatCard
          label="סך חוזים פעילים"
          value={fmt(data.totalContracts)}
          sub={`${data.activeProjects} פרויקטים פעילים`}
          color="bg-blue-500/10 text-blue-400"
          icon={FolderOpen}
        />
        <StatCard
          label="גבוי השנה"
          value={fmt(data.ytdRevenue)}
          sub={`${Math.round((data.ytdRevenue / (data.totalRevenue || 1)) * 100)}% מסה״כ הכנסות`}
          color="bg-purple-500/10 text-purple-400"
          icon={Wallet}
        />
      </div>

      {/* Chart + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Monthly chart — takes 2/3 */}
        <div className="lg:col-span-2">
          <Card>
            <p className="text-sm font-semibold text-gray-300 mb-4">הכנסות — 12 חודשים אחרונים</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Top clients — 1/3 */}
        <Card>
          <p className="text-sm font-semibold text-gray-300 mb-4">לקוחות מובילים</p>
          {data.topClients.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-8">אין נתונים</p>
          ) : (
            <div className="space-y-3">
              {data.topClients.map((c, i) => {
                const pct = data.totalRevenue > 0 ? (c.totalPaid / data.totalRevenue) * 100 : 0
                const colors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500']
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300 truncate">{i + 1}. {c.name}</span>
                      <span className="text-sm font-semibold text-white ms-2 shrink-0">{fmt(c.totalPaid)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${colors[i % colors.length]}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent payments */}
      <Card>
        <p className="text-sm font-semibold text-gray-300 mb-4">תשלומים אחרונים</p>
        {data.recentPayments.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">אין תשלומים עדיין</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <th className="text-right pb-2 pe-4 font-medium">תאריך</th>
                  <th className="text-right pb-2 pe-4 font-medium">פרויקט</th>
                  <th className="text-right pb-2 pe-4 font-medium">אמצעי תשלום</th>
                  <th className="text-right pb-2 pe-4 font-medium">אסמכתא</th>
                  <th className="text-left pb-2 font-medium">סכום</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 pe-4 text-gray-400">{fmtDate(p.date)}</td>
                    <td className="py-2.5 pe-4 text-gray-200">{p.projectName || '—'}</td>
                    <td className="py-2.5 pe-4 text-gray-400">{p.method || '—'}</td>
                    <td className="py-2.5 pe-4 text-gray-500 font-mono text-xs">{p.reference || '—'}</td>
                    <td className="py-2.5 text-green-400 font-semibold">{fmt(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
