import { create } from 'zustand'

/** Stable keys for detail-page tabs (previously localStorage `tab-*` / docs `crm-tab-*`). */
export function detailTabKey(kind: 'lead' | 'client', id: string): string {
  return kind === 'lead' ? `crm-tab-lead-${id}` : `crm-tab-client-${id}`
}

interface UiStore {
  /** Tab id per detail entity (not numeric index; matches `Tabs` `id` fields). */
  detailTabsByKey: Record<string, string>
  setDetailTab: (key: string, tabId: string) => void
  globalSearchOpen: boolean
  setGlobalSearchOpen: (open: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  detailTabsByKey: {},
  setDetailTab: (key, tabId) =>
    set((s) => ({
      detailTabsByKey: { ...s.detailTabsByKey, [key]: tabId },
    })),
  globalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
}))
