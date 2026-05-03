'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

function NewQuoteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const leadId = searchParams.get('leadId')
  const clientId = searchParams.get('clientId')

  const [subjectName, setSubjectName] = useState('')
  const [projects, setProjects] = useState<{ value: string; label: string }[]>([])
  const [loadingContext, setLoadingContext] = useState(true)
  const [form, setForm] = useState({ projectId: '', validUntil: '', paymentTerms: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!leadId && !clientId) {
      router.replace('/quotes')
      return
    }

    if (leadId) {
      fetch(`/api/leads/${leadId}`)
        .then((r) => r.json())
        .then((j) => { setSubjectName(j.data?.fullName ?? ''); setLoadingContext(false) })
    } else if (clientId) {
      fetch(`/api/clients/${clientId}`)
        .then((r) => r.json())
        .then((j) => {
          setSubjectName(j.data?.name ?? '')
          setProjects(
            (j.data?.projects ?? []).map((p: { id: string; name: string }) => ({
              value: p.id,
              label: p.name,
            }))
          )
          setLoadingContext(false)
        })
    }
  }, [leadId, clientId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
        paymentTerms: form.paymentTerms || undefined,
        projectId: form.projectId || undefined,
      }
      if (leadId) body.leadId = leadId
      else if (clientId) body.clientId = clientId

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const json = await res.json()
        router.push(`/quotes/${json.data.id}`)
      } else {
        const json = await res.json()
        setError(json.error ?? 'שגיאה ביצירת הצעת מחיר')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const backHref = leadId ? `/leads/${leadId}` : clientId ? `/clients/${clientId}` : '/quotes'
  const backLabel = leadId ? 'ליד' : 'לקוח'

  return (
    <div className="max-w-lg">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-5">
        <Link href={backHref} className="hover:text-white transition-colors">
          {backLabel}
          {subjectName && `: ${subjectName}`}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-300">הצעת מחיר חדשה</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">הצעת מחיר חדשה</h1>
          {subjectName && (
            <p className="text-sm text-gray-400">
              {leadId ? 'עבור ליד' : 'עבור לקוח'}:{' '}
              <span className="text-white font-medium">{subjectName}</span>
            </p>
          )}
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project selector — only shown when linked to a client that has projects */}
          {clientId && projects.length > 0 && (
            <Select
              label="שייך לפרויקט (אופציונלי)"
              options={[{ value: '', label: 'ללא פרויקט' }, ...projects]}
              value={form.projectId}
              onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}
            />
          )}

          <Input
            label="תוקף הצעה"
            type="date"
            value={form.validUntil}
            onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
          />

          <Input
            label="תנאי תשלום"
            placeholder="30% מקדמה, 70% בסיום"
            value={form.paymentTerms}
            onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))}
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              loading={submitting || loadingContext}
              className="flex-1"
            >
              צור הצעה ועבור לעריכה
            </Button>
            <Link href={backHref}>
              <Button type="button" variant="secondary">
                ביטול
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewQuoteContent />
    </Suspense>
  )
}
