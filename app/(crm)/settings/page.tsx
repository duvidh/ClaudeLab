'use client'

import { useState } from 'react'
import { Plus, X, Save, Building2, Tags, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'

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
      <p className="text-sm font-semibold text-gray-300 mb-2">{title}</p>
      <div className="space-y-1.5 mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2 text-sm text-white">
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
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
  const [saved, setSaved] = useState(false)

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
    setSaved(false)
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 max-w-lg">
      <Card>
        <p className="text-sm font-semibold text-gray-300 mb-4">פרטי החברה</p>
        <div className="space-y-3">
          <Input label="שם החברה" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <Input label='ח.פ / ע.מ' value={form.taxId} onChange={(e) => set('taxId', e.target.value)} />
          <Input label="כתובת" value={form.address} onChange={(e) => set('address', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="טלפון" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input label="אימייל" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <Input label="אתר אינטרנט" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-gray-300 mb-4">הגדרות חשבונאות</p>
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
}

function ListsTab() {
  const [lists, setLists] = useState(DEFAULT_LISTS)
  const [saved, setSaved] = useState(false)

  function setList(key: keyof typeof lists, items: string[]) {
    setLists((p) => ({ ...p, [key]: items }))
    setSaved(false)
  }

  function save() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
        </div>
      </Card>

      <Button onClick={save} className="gap-2">
        <Save size={15} />
        {saved ? 'נשמר!' : 'שמור שינויים'}
      </Button>
    </div>
  )
}

// ─── Recycle bin tab ───────────────────────────────────────────────────────

function RecycleBinTab() {
  return (
    <div className="max-w-xl">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">פח מחזור</p>
            <p className="text-xs text-gray-500">פריטים שנמחקו — ניתן לשחזר תוך 30 יום</p>
          </div>
        </div>
        <div className="text-center py-10 text-gray-600 text-sm">
          פח המחזור ריק
        </div>
      </Card>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'company', label: 'פרטי חברה', icon: Building2 },
  { id: 'lists', label: 'רשימות / תפריטים', icon: Tags },
  { id: 'recycle', label: 'פח מחזור', icon: Trash2 },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('company')

  return (
    <div>
      <PageHeader title="הגדרות" subtitle="ניהול מידע, רשימות ואפשרויות מערכת" />

      <div className="flex gap-1 mb-6 bg-gray-800/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
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
      {tab === 'recycle' && <RecycleBinTab />}
    </div>
  )
}
