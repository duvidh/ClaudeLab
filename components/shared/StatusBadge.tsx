import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types'

const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
  SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
}

const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
}

interface StatusBadgeProps {
  type: 'lead' | 'project' | 'quote' | 'task' | 'priority'
  value: string
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  let label = value
  let colorClass = ''

  switch (type) {
    case 'lead':
      label = LEAD_STATUS_LABELS[value as keyof typeof LEAD_STATUS_LABELS] ?? value
      colorClass = LEAD_STATUS_COLORS[value as keyof typeof LEAD_STATUS_COLORS] ?? ''
      break
    case 'project':
      label = PROJECT_STATUS_LABELS[value] ?? value
      colorClass = PROJECT_STATUS_COLORS[value] ?? ''
      break
    case 'quote':
      label = QUOTE_STATUS_LABELS[value] ?? value
      colorClass = QUOTE_STATUS_COLORS[value] ?? ''
      break
    case 'task':
      label = TASK_STATUS_LABELS[value] ?? value
      colorClass = TASK_STATUS_COLORS[value] ?? ''
      break
    case 'priority':
      label = PRIORITY_LABELS[value] ?? value
      colorClass = PRIORITY_COLORS[value] ?? ''
      break
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
      {label}
    </span>
  )
}
