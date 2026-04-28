import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { ClientFinancials } from '@/lib/calculations'

interface FinancialSummaryProps {
  financials: ClientFinancials
}

export function FinancialSummary({ financials }: FinancialSummaryProps) {
  const { totalContracts, totalPaid, balance } = financials
  const paidPercent = totalContracts > 0 ? (totalPaid / totalContracts) * 100 : 0

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        icon={DollarSign}
        iconColor="text-blue-400"
        iconBg="bg-blue-500/10"
        label='סה"כ חוזים'
        value={formatCurrency(totalContracts)}
      />
      <StatCard
        icon={TrendingUp}
        iconColor="text-green-400"
        iconBg="bg-green-500/10"
        label='סה"כ שולם'
        value={formatCurrency(totalPaid)}
        sub={`${paidPercent.toFixed(0)}% מהחוזה`}
      />
      <StatCard
        icon={balance > 0 ? TrendingDown : CreditCard}
        iconColor={balance > 0 ? 'text-yellow-400' : 'text-teal-400'}
        iconBg={balance > 0 ? 'bg-yellow-500/10' : 'bg-teal-500/10'}
        label="יתרה לתשלום"
        value={formatCurrency(balance)}
        valueColor={balance > 0 ? 'text-yellow-300' : 'text-teal-300'}
      />
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  valueColor = 'text-white',
}: {
  icon: typeof DollarSign
  iconColor: string
  iconBg: string
  label: string
  value: string
  sub?: string
  valueColor?: string
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={iconColor} />
        </div>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}
