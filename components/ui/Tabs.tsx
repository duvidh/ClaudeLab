'use client'

import { cn } from '@/lib/utils'

export interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-gray-700 mb-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === tab.id
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'mr-1.5 text-xs px-1.5 py-0.5 rounded-full',
              activeTab === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-700 text-gray-400'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
