'use client'

import { useState, useEffect } from 'react'
import { Settings, Shield, AlertTriangle, GitPullRequest, Milestone, Layers, ShoppingCart } from 'lucide-react'
import { Card } from '@/components/ui/Card'

type ProjectSettings = {
  enableMilestones: boolean
  enableQC: boolean
  enableRisks: boolean
  enableChangeRequests: boolean
  enableWBS: boolean
  enableProcurement: boolean
}

interface ProjectSettingsPanelProps {
  projectId: string
  onSettingsChange?: (s: ProjectSettings) => void
}

const MODULES = [
  {
    key: 'enableMilestones' as keyof ProjectSettings,
    icon: Milestone,
    title: 'אבני דרך',
    desc: 'ניהול שלבים ואבני ציון בפרויקט',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    key: 'enableRisks' as keyof ProjectSettings,
    icon: AlertTriangle,
    title: 'ניהול סיכונים',
    desc: 'מעקב אחר סיכונים, הסתברות ותוכניות מיגון',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    key: 'enableChangeRequests' as keyof ProjectSettings,
    icon: GitPullRequest,
    title: 'בקשות שינוי',
    desc: 'ניהול שינויים בהיקף, עלות ולוח זמנים',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    key: 'enableQC' as keyof ProjectSettings,
    icon: Shield,
    title: 'בקרת איכות',
    desc: 'רשימות ביקורת, בדיקות ממ"ת (NCR)',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    key: 'enableWBS' as keyof ProjectSettings,
    icon: Layers,
    title: 'תכולת עבודה (WBS)',
    desc: 'פירוק עבודה לחבילות + רשימת חומרים (BOM)',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
  {
    key: 'enableProcurement' as keyof ProjectSettings,
    icon: ShoppingCart,
    title: 'רכש וספקים',
    desc: 'ניהול חוזים, ספקים ודירוגם',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
]

export function ProjectSettingsPanel({ projectId, onSettingsChange }: ProjectSettingsPanelProps) {
  const [settings, setSettings] = useState<ProjectSettings | null>(null)
  const [saving, setSaving] = useState<keyof ProjectSettings | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/settings`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setSettings(j.data)
      })
      .catch(() => {})
  }, [projectId])

  async function toggle(key: keyof ProjectSettings) {
    if (!settings) return
    const next = !settings[key]
    setSaving(key)
    try {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next }),
      })
      if (res.ok) {
        const updated = { ...settings, [key]: next }
        setSettings(updated)
        onSettingsChange?.(updated)
      }
    } finally {
      setSaving(null)
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">מודולים פעילים</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">הפעל או כבה פיצ'רים לפרויקט זה</span>
      </div>
      {MODULES.map((mod) => {
        const Icon = mod.icon
        const enabled = settings[mod.key]
        const isSaving = saving === mod.key
        return (
          <Card key={mod.key}>
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${mod.bg}`}>
                <Icon size={18} className={mod.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{mod.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{mod.desc}</p>
              </div>
              <button
                onClick={() => toggle(mod.key)}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                  enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                role="switch"
                aria-checked={enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
