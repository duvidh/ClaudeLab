'use client'

import { useState, useEffect } from 'react'

const DEFAULT_LISTS = {
  workTypes: ['ריצוף', 'גבס', 'צבע', 'אינסטלציה', 'חשמל', 'שיפוץ כללי', 'בנייה', 'גינון'],
  cities: ['תל אביב', 'ירושלים', 'חיפה', 'ראשון לציון', 'פתח תקוה', 'נתניה', 'אשדוד', 'באר שבע', 'רמת גן', 'הרצליה'],
  paymentMethods: ['מזומן', "צ'ק", 'העברה בנקאית', 'כרטיס אשראי', 'ביט'],
  projectTypes: ['שיפוץ דירה', 'בניה חדשה', 'שיפוץ מסחרי', 'עבודות חוץ', 'תוספת בנייה', 'עיצוב פנים'],
  supplierCategories: ['חומרי בניה', 'כלים', 'ריצוף', 'גבס', 'חשמל', 'אינסטלציה', 'צבע', 'אחר'],
}

export type SettingsLists = typeof DEFAULT_LISTS

export function useSettingsLists(): SettingsLists {
  const [lists, setLists] = useState<SettingsLists>(DEFAULT_LISTS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('crm-settings-lists')
      if (stored) setLists({ ...DEFAULT_LISTS, ...JSON.parse(stored) })
    } catch {}
  }, [])

  return lists
}
