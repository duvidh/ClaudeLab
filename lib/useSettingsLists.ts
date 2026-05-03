'use client'

import { useState, useEffect } from 'react'
import { CRM_SETTING_KEYS } from '@/lib/crm-settings'

/** Defaults aligned with `app/(crm)/settings/page.tsx` */
const DEFAULT_LISTS = {
  workTypes: ['ריצוף', 'גבס', 'צבע', 'אינסטלציה', 'חשמל', 'שיפוץ כללי', 'בנייה'],
  leadSources: ['אתר אינטרנט', 'הפניה', 'פייסבוק', 'גוגל', 'טלפון', 'אחר'],
  cities: ['תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקוה', 'נתניה'],
  paymentMethods: ['מזומן', "צ'ק", 'העברה בנקאית', 'כרטיס אשראי', 'ביט'],
  projectTypes: ['שיפוץ דירה', 'בניה חדשה', 'שיפוץ מסחרי', 'עבודות חוץ', 'תוספת בנייה'],
  supplierCategories: ['חומרי בניה', 'כלים', 'ריצוף', 'גבס', 'חשמל', 'אינסטלציה', 'צבע', 'אחר'],
}

export type SettingsLists = typeof DEFAULT_LISTS

export function useSettingsLists(): SettingsLists {
  const [lists, setLists] = useState<SettingsLists>(DEFAULT_LISTS)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/settings')
        const j = await res.json()
        if (cancelled) return
        const raw = j.data?.[CRM_SETTING_KEYS.lists]
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          setLists({ ...DEFAULT_LISTS, ...raw })
        }
      } catch {
        /* keep defaults */
      }
    }

    load()
    function onChanged() { load() }
    window.addEventListener('crm-settings-changed', onChanged)
    return () => {
      cancelled = true
      window.removeEventListener('crm-settings-changed', onChanged)
    }
  }, [])

  return lists
}
