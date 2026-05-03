/** Keys stored in `SystemSetting` (JSON-encoded in `value`). */
export const CRM_SETTING_KEYS = {
  company: 'company',
  logo: 'logo',
  lists: 'lists',
} as const

export type CrmSettingsMap = {
  company?: Record<string, unknown>
  logo?: string | null
  lists?: Record<string, unknown>
}
