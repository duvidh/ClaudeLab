import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  id?: string
  label?: string
  error?: string
  className?: string
  children: ReactNode
}

export function FormField({ id, label, error, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label htmlFor={id} className="text-sm text-gray-300 font-medium">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
