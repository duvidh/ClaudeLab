import { SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-white dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none',
            error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="bg-white dark:bg-gray-800">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-800">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
