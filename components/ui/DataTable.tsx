'use client'

import { ReactNode, cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  content: ReactNode
  rowClassName?: string
  cellClassName?: string
}

interface DataTableProps<T> {
  headers: ReactNode[]
  data: T[]
  renderRow: (item: T, index: number) => ReactNode
  emptyStateProps?: EmptyStateProps
  wrapperClassName?: string
  tableClassName?: string
  headerRowClassName?: string
  headerCellClassName?: string
  bodyClassName?: string
}

export function DataTable<T>({
  headers,
  data,
  renderRow,
  emptyStateProps,
  wrapperClassName,
  tableClassName,
  headerRowClassName,
  headerCellClassName,
  bodyClassName,
}: DataTableProps<T>) {
  const defaultHeaderCellClassName = 'px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-right'

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700', wrapperClassName)}>
      <table className={cn('w-full text-sm', tableClassName)}>
        <thead>
          <tr className={cn('bg-gray-100 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 group', headerRowClassName)}>
            {headers.map((header, index) => {
              if (typeof header === 'string' || typeof header === 'number') {
                return (
                  <th key={index} className={cn(defaultHeaderCellClassName, headerCellClassName)}>
                    {header}
                  </th>
                )
              }
              if (isValidElement(header)) return cloneElement(header, { key: index })
              return (
                <th key={index} className={cn(defaultHeaderCellClassName, headerCellClassName)}>
                  {header}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className={cn('divide-y divide-gray-100 dark:divide-gray-700', bodyClassName)}>
          {data.length > 0 && data.map(renderRow)}
          {data.length === 0 && emptyStateProps && (
            <tr className={emptyStateProps.rowClassName}>
              <td colSpan={headers.length} className={cn('px-4 py-8 text-center text-gray-500 dark:text-gray-400', emptyStateProps.cellClassName)}>
                {emptyStateProps.content}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
