'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Save, Building2, Tags, Database, HardHat, Upload, Trash2, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { CRM_SETTING_KEYS } from '@/lib/crm-settings'

// ─── Editable list component ───────────────────────────────────────────────

function EditableList({
  title,
  items,
  onChange,
}: {
  title: string
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [newItem, setNewItem] = useState('')

  function add() {
    const v = newItem.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setNewItem('')
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</p>
      <div className="space-y-1.5 mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
            <span>{item}</span>
            <button onClick={() => remove(idx)} className="text-gray-500 hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-600 px-1">אין ערכים. הוסף ראשון.</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="הוסף ערך..."
          className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={add}
          disabled={!newItem.trim()}
          className="p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Company info form ─────────────────────────────────────────────────────

const DEFAULT_COMPANY = {
  name: 'חברת הבנייה שלי',
  taxId: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  vatPercent: '17',
}

function CompanyTab() {
  const [form, setForm] = useState(DEFAULT_COMPANY)
  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        const j = await res.json()
        if (cancelled) return
        const d = j.data ?? {}
        const company = d[CRM_SETTING_KEYS.company]
        if (company && typeof company === 'object' && !Array.isArray(company)) {
          setForm({ ...DEFAULT_COMPANY, ...company })
        }
        const logoVal = d[CRM_SETTING_KEYS.logo]
        if (typeof logoVal === 'string') setLogo(logoVal)
        else setLogo(null)
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
    setSaved(false)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setLogo(ev.target?.result as string)
    reader.readAsDataURL(file)
    setSaved(false)
  }

  async function save() {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          [CRM_SETTING_KEYS.company]: form,
          [CRM_SETTING_KEYS.logo]: logo,
        },
      }),
    })
    if (!res.ok) return
    window.dispatchEvent(new Event('crm-settings-changed'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 max-w-lg">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg">
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">לוגו החברה</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt="לוגו" className="w-full h-full object-contain" /> : <HardHat size={24} className="text-blue-400" />}
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-blue-400 hover:text-blue-300 transition-colors">
              <Upload size={14} />
              העלה לוגו
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
            {logo && (
              <button onClick={() => setLogo(null)} className="block text-xs text-gray-500 hover:text-red-400 transition-colors">
                הסר לוגו
              </button>
            )}
            <p className="text-xs text-gray-600">PNG, JPG, SVG עד 2MB</p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">פרטי החברה</p>
        <div className="space-y-3">
          <Input label="שם החברה" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Input label='ח.פ / ע.מ' value={form.taxId} onChange={(e) => set('taxId', e.target.value)} />
          <Input label="כתובת" value={form.address} onChange={(e) => set('address', e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="טלפון" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input label="אימייל" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <Input label="אתר אינטרנט" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">הגדרות חשבונאות</p>
        <div className="max-w-xs">
          <Input
            label="אחוז מע״מ (%)"
            type="number"
            value={form.vatPercent}
            onChange={(e) => set('vatPercent', e.target.value)}
          />
        </div>
      </Card>

      <Button onClick={save} className="gap-2">
        <Save size={15} />
        {saved ? 'נשמר!' : 'שמור שינויים'}
      </Button>
    </div>
  )
}

// ─── Lists / dropdowns tab ─────────────────────────────────────────────────

const DEFAULT_LISTS = {
  workTypes: ['ריצוף', 'גבס', 'צבע', 'אינסטלציה', 'חשמל', 'שיפוץ כללי', 'בנייה'],
  leadSources: ['אתר אינטרנט', 'הפניה', 'פייסבוק', 'גוגל', 'טלפון', 'אחר'],
  cities: ['תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקוה', 'נתניה'],
  paymentMethods: ['מזומן', "צ'ק", 'העברה בנקאית', 'כרטיס אשראי', 'ביט'],
  projectTypes: ['שיפוץ דירה', 'בניה חדשה', 'שיפוץ מסחרי', 'עבודות חוץ', 'תוספת בנייה'],
  supplierCategories: ['חומרי בניה', 'כלים', 'ריצוף', 'גבס', 'חשמל', 'אינסטלציה', 'צבע', 'אחר'],
}

function ListsTab() {
  const [lists, setLists] = useState(DEFAULT_LISTS)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        const j = await res.json()
        if (cancelled) return
        const raw = j.data?.[CRM_SETTING_KEYS.lists]
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          setLists({ ...DEFAULT_LISTS, ...raw })
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  function setList(key: keyof typeof DEFAULT_LISTS, items: string[]) {
    setLists((p) => ({ ...p, [key]: items }))
    setSaved(false)
  }

  async function save() {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { [CRM_SETTING_KEYS.lists]: lists } }),
    })
    if (!res.ok) return
    window.dispatchEvent(new Event('crm-settings-changed'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16 max-w-xl">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-xl">
      <Card>
        <div className="grid gap-6">
          <EditableList title="סוגי עבודה" items={lists.workTypes} onChange={(v) => setList('workTypes', v)} />
          <EditableList title="מקורות ליד" items={lists.leadSources} onChange={(v) => setList('leadSources', v)} />
          <EditableList title="ערים" items={lists.cities} onChange={(v) => setList('cities', v)} />
          <EditableList title="שיטות תשלום" items={lists.paymentMethods} onChange={(v) => setList('paymentMethods', v)} />
          <EditableList title="סוגי פרויקט" items={lists.projectTypes} onChange={(v) => setList('projectTypes', v)} />
          <EditableList title="קטגוריות ספקים" items={lists.supplierCategories} onChange={(v) => setList('supplierCategories', v)} />
        </div>
      </Card>

      <Button onClick={save} className="gap-2">
        <Save size={15} />
        {saved ? 'נשמר!' : 'שמור שינויים'}
      </Button>
    </div>
  )
}

// ─── System data tab ──────────────────────────────────────────────────────

type SystemStats = {
  leads: number
  clients: number
  projects: number
  quotes: number
  tasks: number
  catalogItems: number
  payments: number
  notifications: number
}

function SystemDataTab() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/stats')
      .then((r) => r.json())
      .then((j) => { setStats(j.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const rows: { label: string; key: keyof SystemStats; color: string }[] = [
    { label: 'לידים', key: 'leads', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'לקוחות', key: 'clients', color: 'text-teal-600 dark:text-teal-400' },
    { label: 'פרויקטים', key: 'projects', color: 'text-purple-600 dark:text-purple-400' },
    { label: 'הצעות מחיר', key: 'quotes', color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'משימות', key: 'tasks', color: 'text-orange-600 dark:text-orange-400' },
    { label: 'פריטי קטלוג', key: 'catalogItems', color: 'text-green-600 dark:text-green-400' },
    { label: 'תשלומים', key: 'payments', color: 'text-pink-600 dark:text-pink-400' },
    { label: 'התראות', key: 'notifications', color: 'text-gray-500 dark:text-gray-400' },
  ]

  return (
    <div className="max-w-xl">
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Database size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">נתוני מערכת</p>
            <p className="text-xs text-gray-500">סיכום כמות הרשומות בכל מודול</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map(({ label, key, color }) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className={`text-lg font-bold ${color}`}>{stats?.[key] ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Recycle bin tab ──────────────────────────────────────────────────────

type DeletedItem = {
  id: string
  type: 'lead' | 'client'
  fullName?: string
  name?: string
  primaryPhone?: string
  city?: string
  status: string
  deletedAt: string
}

function RecycleBinTab() {
  const [leads, setLeads] = useState<DeletedItem[]>([])
  const [clients, setClients] = useState<DeletedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/recycle-bin')
      const j = await res.json()
      setLeads(j.data?.leads ?? [])
      setClients(j.data?.clients ?? [])
    } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [])

  async function act(type: 'lead' | 'client', id: string, action: 'restore' | 'delete') {
    setActionId(id)
    try {
      await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, action }),
      })
      await load()
    } finally { setActionId(null) }
  }

  const isEmpty = leads.length === 0 && clients.length === 0

  function ItemRow({ item }: { item: DeletedItem }) {
    const label = item.type === 'lead' ? item.fullName : item.name
    const sub = item.type === 'lead' ? item.primaryPhone : item.city
    const busy = actionId === item.id
    return (
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
        <div>
          <p className="text-sm text-gray-900 dark:text-white">{label}</p>
          <p className="text-xs text-gray-500">
            {item.type === 'lead' ? 'ליד' : 'לקוח'}{sub ? ` · ${sub}` : ''} · נמחק {new Date(item.deletedAt).toLocaleDateString('he-IL')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => act(item.type, item.id, 'restore')}
            disabled={busy}
            title="שחזר"
            className="p-1.5 text-gray-400 hover:text-green-400 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => act(item.type, item.id, 'delete')}
            disabled={busy}
            title="מחק לצמיתות"
            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">סל מחזור</p>
            <p className="text-xs text-gray-500">לידים ולקוחות שנמחקו — ניתן לשחזר או למחוק לצמיתות</p>
          </div>
          <button onClick={load} className="text-xs text-blue-400 hover:text-blue-300">רענן</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <p className="text-sm text-gray-600 text-center py-8">סל המחזור ריק</p>
        ) : (
          <div className="space-y-2">
            {[...leads, ...clients].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()).map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'company', label: 'פרטי חברה', icon: Building2 },
  { id: 'lists', label: 'רשימות / תפריטים', icon: Tags },
  { id: 'data', label: 'נתוני מערכת', icon: Database },
  { id: 'recycle', label: 'סל מחזור', icon: Trash2 },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('company')

  return (
    <div>
      <PageHeader title="הגדרות" subtitle="ניהול מידע, רשימות ואפשרויות מערכת" />

      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'company' && <CompanyTab />}
      {tab === 'lists' && <ListsTab />}
      {tab === 'data' && <SystemDataTab />}
      {tab === 'recycle' && <RecycleBinTab />}
    </div>
  )
}
