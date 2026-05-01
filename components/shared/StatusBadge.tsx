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
      colorClass = LEAD_STATUS_COLORS[value as keyof typeof LEAD_STATUS_COLORS] ?? 'bg-gray-700 text-gray-300'
      break
    case 'project':
      label = PROJECT_STATUS_LABELS[value] ?? value
      colorClass = PROJECT_STATUS_COLORS[value] ?? 'bg-gray-700 text-gray-300'
      break
    case 'quote':
      label = QUOTE_STATUS_LABELS[value] ?? value
      break
    case 'task':
      label = TASK_STATUS_LABELS[value] ?? value
      break
    case 'priority':
      label = PRIORITY_LABELS[value] ?? value
      colorClass = PRIORITY_COLORS[value] ?? 'bg-gray-700 text-gray-300'
      break
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass || 'bg-gray-700 text-gray-300'}`}>
      {label}
    </span>
  )
}
