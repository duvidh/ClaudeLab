'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FolderKanban,
  FileText,
  Package,
  CheckSquare,
  Calendar,
  Settings,
  HardHat,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/leads', label: 'לידים', icon: Users },
  { href: '/clients', label: 'לקוחות', icon: UserCheck },
  { href: '/projects', label: 'פרויקטים', icon: FolderKanban },
  { href: '/quotes', label: 'הצעות מחיר', icon: FileText },
  { href: '/catalog', label: 'קטלוג חומרים', icon: Package },
  { href: '/tasks', label: 'משימות', icon: CheckSquare },
  { href: '/calendar', label: 'יומן', icon: Calendar },
  { href: '/settings', label: 'הגדרות', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 right-0 z-30 h-full w-60 bg-gray-950 border-l border-gray-800 flex flex-col transition-transform duration-200',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <HardHat size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">BuildCRM</p>
              <p className="text-xs text-gray-500 mt-0.5">קבלנות בניה</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <Icon size={18} className="shrink-0" />
                <span>{label}</span>
                {isActive && (
                  <span className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800">
          <p className="text-xs text-gray-600 text-center">v1.0.0</p>
        </div>
      </aside>
    </>
  )
}
