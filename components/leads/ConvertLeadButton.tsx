'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

interface ConvertLeadButtonProps {
  leadId: string
  leadName: string
  disabled?: boolean
}

export function ConvertLeadButton({ leadId, leadName, disabled }: ConvertLeadButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleConvert() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setOpen(false)
      router.push(`/clients/${json.data.id}`)
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'שגיאה בהמרה')
    } finally {
      setLoading(false)
    }
  }

  if (disabled) return null

  return (
    <>
      <Button
        variant="success"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <UserCheck size={14} />
        המר ללקוח
      </Button>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConvert}
        loading={loading}
        title="המרת ליד ללקוח"
        message={`האם להמיר את "${leadName}" ללקוח? פרטי הליד יועברו לכרטיס הלקוח ותיווצר משימה לפתיחת פרויקט.`}
        confirmLabel="המר ללקוח"
      />
    </>
  )
}
