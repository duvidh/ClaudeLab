'use client'

import React, { useState, useEffect } from 'react'
import { FileDown, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type QuoteForPDF = {
  quoteNumber: string
  date: string
  validUntil?: string | null
  version: number
  discount: number
  paymentTerms?: string | null
  notes?: string | null
  client: { name: string; address?: string | null; email?: string | null }
  project?: { name: string } | null
  items: Array<{
    id: string
    sequenceNumber: number
    productName: string
    dimension1?: number | null
    dimension2?: number | null
    unit?: string | null
    unitPrice: number
    materialsCost: number
    transportCost: number
    laborCost: number
    notes?: string | null
  }>
}

export function PDFExportButton({ quote, clientId }: { quote: QuoteForPDF; clientId?: string }) {
  const [ready, setReady] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [QuotePDFDocument, setQuotePDFDocument] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfLib, setPdfLib] = useState<any>(null)
  const [companyName] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      const stored = localStorage.getItem('crm-settings-company')
      if (stored) return JSON.parse(stored).name ?? ''
    } catch {}
    return ''
  })
  const [saving, setSaving] = useState(false)
  const [savedDoc, setSavedDoc] = useState(false)

  useEffect(() => {
    Promise.all([
      import('@react-pdf/renderer'),
      import('./QuotePDF'),
    ]).then(([lib, pdfDoc]) => {
      setPDFDownloadLink(() => lib.PDFDownloadLink)
      setQuotePDFDocument(() => pdfDoc.QuotePDFDocument)
      setPdfLib(lib)
      setReady(true)
    })
  }, [])

  async function handleSaveToDocuments() {
    if (!pdfLib || !QuotePDFDocument || !clientId) return
    setSaving(true)
    try {
      const blob = await pdfLib.pdf(
        React.createElement(QuotePDFDocument, { quote, companyName })
      ).toBlob()
      const file = new File([blob], `הצעת-מחיר-${quote.quoteNumber}.pdf`, { type: 'application/pdf' })
      const fd = new FormData()
      fd.append('file', file)
      fd.append('type', 'other')
      const res = await fetch(`/api/clients/${clientId}/files`, { method: 'POST', body: fd })
      if (res.ok) {
        setSavedDoc(true)
        setTimeout(() => setSavedDoc(false), 3000)
      }
    } finally { setSaving(false) }
  }

  if (!ready || !PDFDownloadLink || !QuotePDFDocument) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <FileDown size={14} />
        ייצוא PDF
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <PDFDownloadLink
        document={<QuotePDFDocument quote={quote} companyName={companyName} />}
        fileName={`הצעת-מחיר-${quote.quoteNumber}.pdf`}
        style={{ textDecoration: 'none' }}
      >
        {({ loading }: { loading: boolean }) => (
          <Button variant="secondary" size="sm" disabled={loading}>
            <FileDown size={14} />
            {loading ? 'מכין...' : 'ייצוא PDF'}
          </Button>
        )}
      </PDFDownloadLink>
      {clientId && (
        <Button variant="secondary" size="sm" onClick={handleSaveToDocuments} loading={saving}>
          {savedDoc ? <Check size={14} className="text-green-400" /> : <Save size={14} />}
          {savedDoc ? 'נשמר!' : 'שמור למסמכים'}
        </Button>
      )}
    </div>
  )
}
