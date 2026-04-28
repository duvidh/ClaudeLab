'use client'

import { useState, useEffect } from 'react'
import { FileDown } from 'lucide-react'
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

export function PDFExportButton({ quote }: { quote: QuoteForPDF }) {
  const [ready, setReady] = useState(false)
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null)
  const [QuotePDFDocument, setQuotePDFDocument] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      import('@react-pdf/renderer'),
      import('./QuotePDF'),
    ]).then(([pdfLib, pdfDoc]) => {
      setPDFDownloadLink(() => pdfLib.PDFDownloadLink)
      setQuotePDFDocument(() => pdfDoc.QuotePDFDocument)
      setReady(true)
    })
  }, [])

  if (!ready || !PDFDownloadLink || !QuotePDFDocument) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <FileDown size={14} />
        ייצוא PDF
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<QuotePDFDocument quote={quote} />}
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
  )
}
