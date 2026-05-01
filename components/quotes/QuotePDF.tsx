'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { calcLinePrice, calcQuoteSummary } from '@/lib/calculations'
import { fixPdfHebrew } from '@/lib/pdf-utils'

// HeeboHebrew: covers Hebrew characters + ₪ (U+0590-05FF, U+20AA)
// HeeboLatin:  covers digits, punctuation, and basic Latin (U+0000-00FF)
Font.register({
  family: 'HeeboHebrew',
  fonts: [
    { src: '/api/fonts/heebo-hebrew' },
    { src: '/api/fonts/heebo-hebrew?bold=1', fontWeight: 700 },
  ],
})
Font.register({
  family: 'HeeboLatin',
  fonts: [
    { src: '/api/fonts/heebo-latin' },
    { src: '/api/fonts/heebo-latin?bold=1', fontWeight: 700 },
  ],
})

const H = 'HeeboHebrew'  // font alias for Hebrew text
const L = 'HeeboLatin'   // font alias for numbers / Latin characters

const styles = StyleSheet.create({
  page: {
    fontFamily: H,
    direction: 'rtl',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',

  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  companyName: { fontSize: 20, fontWeight: 700, color: '#1E40AF', fontFamily: H, direction: 'rtl', textAlign: 'right' },
  companyInfo: { fontSize: 8, color: '#6B7280', marginTop: 2, fontFamily: H, direction: 'rtl', textAlign: 'right' },
  quoteTitle: { fontSize: 18, fontWeight: 700, color: '#111827', textAlign: 'right', fontFamily: H, direction: 'rtl' },
  quoteMeta: { fontSize: 9, color: '#6B7280', textAlign: 'right', marginTop: 3, fontFamily: H, direction: 'rtl' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#111827', marginBottom: 8, fontFamily: H, direction: 'rtl', textAlign: 'right' },
  clientBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientRow: { flexDirection: 'row-reverse', gap: 4, marginBottom: 2 },
  clientLabel: { fontSize: 9, color: '#6B7280', width: 60, fontFamily: H, direction: 'rtl', textAlign: 'right' },
  clientValue: { fontSize: 9, color: '#111827', fontFamily: H, direction: 'rtl', textAlign: 'right' },
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#1E3A5F',
    padding: '6 4',
    borderRadius: 2,
  },
  tableHeaderCell: { color: '#FFFFFF', fontSize: 8, fontWeight: 700, textAlign: 'right', fontFamily: H, direction: 'rtl' },
  tableRow: {
    flexDirection: 'row-reverse',
    padding: '5 4',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  cell: { fontSize: 8, color: '#374151', textAlign: 'right', fontFamily: H, direction: 'rtl' },
  cellNum: { fontSize: 8, color: '#374151', textAlign: 'right', fontFamily: L, direction: 'rtl' },
  colSeq: { width: '5%' },
  colName: { width: '28%' },
  colDim: { width: '14%' },
  colUnit: { width: '8%' },
  colPrice: { width: '17%' },
  colLine: { width: '18%' },
  summarySection: { marginTop: 16, flexDirection: 'row-reverse', justifyContent: 'flex-start' },
  summaryBox: {
    width: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: '5 10',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: { fontSize: 9, color: '#6B7280', fontFamily: H, direction: 'rtl', textAlign: 'right' },
  summaryValue: { fontSize: 9, color: '#111827', fontFamily: L, direction: 'rtl', textAlign: 'right' },
  summaryTotalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: '7 10',
    backgroundColor: '#1E3A5F',
  },
  summaryTotalLabel: { fontSize: 10, color: '#FFFFFF', fontWeight: 700, fontFamily: H, direction: 'rtl', textAlign: 'right' },
  summaryTotalValue: { fontSize: 10, color: '#FFFFFF', fontWeight: 700, fontFamily: L, direction: 'rtl', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#9CA3AF', fontFamily: H, direction: 'rtl', textAlign: 'right' },
  notesBox: {
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    padding: 8,
  },
  notesText: { fontSize: 8, color: '#92400E', fontFamily: H, direction: 'rtl', textAlign: 'right' },
})

// Renders ₪ with Hebrew font + number with Latin font
function PriceText({ amount, style }: { amount: number; style?: Style | Style[] }) {
  const num = amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <Text style={style}>
      <Text style={{ fontFamily: H }}>{fixPdfHebrew('₪')}</Text>
      <Text style={{ fontFamily: L }}>{fixPdfHebrew(num)}</Text>
    </Text>
  )
}

type QuoteItem = {
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
}

type QuoteData = {
  quoteNumber: string
  date: string
  validUntil?: string | null
  version: number
  discount: number
  paymentTerms?: string | null
  notes?: string | null
  client: { name: string; address?: string | null; email?: string | null }
  project?: { name: string } | null
  items: QuoteItem[]
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('he-IL')
}

export function QuotePDFDocument({ quote, companyName }: { quote: QuoteData; companyName?: string }) {
  const summary = calcQuoteSummary(quote.items, quote.discount)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{fixPdfHebrew(companyName || 'חברת הבנייה')}</Text>
            <Text style={styles.companyInfo}>{fixPdfHebrew('קבלן שיפוצים ובנייה')}</Text>
          </View>
          <View>
            <Text style={styles.quoteTitle}>{fixPdfHebrew('הצעת מחיר')}</Text>
            <Text style={styles.quoteMeta}>
              {fixPdfHebrew('מספר: ')}
              <Text style={{ fontFamily: L }}>{fixPdfHebrew(quote.quoteNumber)}</Text>
            </Text>
            <Text style={styles.quoteMeta}>{fixPdfHebrew('תאריך: ')}{fixPdfHebrew(fmtDate(quote.date))}</Text>
            {quote.validUntil && (
              <Text style={styles.quoteMeta}>{fixPdfHebrew('בתוקף עד: ')}{fixPdfHebrew(fmtDate(quote.validUntil))}</Text>
            )}
            <Text style={styles.quoteMeta}>
              {fixPdfHebrew('גרסה: ')}
              <Text style={{ fontFamily: L }}>{fixPdfHebrew(`v${quote.version}`)}</Text>
            </Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{fixPdfHebrew('פרטי לקוח')}</Text>
          <View style={styles.clientBox}>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>{fixPdfHebrew('שם:')}</Text>
              <Text style={styles.clientValue}>{fixPdfHebrew(quote.client.name)}</Text>
            </View>
            {quote.client.address && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>{fixPdfHebrew('כתובת:')}</Text>
                <Text style={styles.clientValue}>{fixPdfHebrew(quote.client.address)}</Text>
              </View>
            )}
            {quote.client.email && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>{fixPdfHebrew('אימייל:')}</Text>
                <Text style={[styles.clientValue, { fontFamily: L }]}>{fixPdfHebrew(quote.client.email)}</Text>
              </View>
            )}
            {quote.project && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>{fixPdfHebrew('פרויקט:')}</Text>
                <Text style={styles.clientValue}>{fixPdfHebrew(quote.project.name)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{fixPdfHebrew('פירוט עבודות וחומרים')}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colSeq]}>{fixPdfHebrew('#')}</Text>
              <Text style={[styles.tableHeaderCell, styles.colName]}>{fixPdfHebrew('תיאור')}</Text>
              <Text style={[styles.tableHeaderCell, styles.colDim]}>{fixPdfHebrew('מידות')}</Text>
              <Text style={[styles.tableHeaderCell, styles.colUnit]}>{fixPdfHebrew('יחידה')}</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>{fixPdfHebrew('מחיר יחידה')}</Text>
              <Text style={[styles.tableHeaderCell, styles.colLine]}>{fixPdfHebrew('סה"כ שורה')}</Text>
            </View>
            {quote.items.map((item, idx) => {
              const linePrice = calcLinePrice(item)
              const dimText = item.dimension1 && item.dimension2
                ? `${item.dimension1} × ${item.dimension2}`
                : item.dimension1
                ? `${item.dimension1}`
                : ''
              return (
                <View key={item.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.cellNum, styles.colSeq]}>{fixPdfHebrew(item.sequenceNumber)}</Text>
                  <Text style={[styles.cell, styles.colName]}>{fixPdfHebrew(item.productName)}</Text>
                  <Text style={[styles.cellNum, styles.colDim]}>{fixPdfHebrew(dimText)}</Text>
                  <Text style={[styles.cell, styles.colUnit]}>{fixPdfHebrew(item.unit ?? '')}</Text>
                  <PriceText amount={item.unitPrice} style={[styles.cellNum, styles.colPrice]} />
                  <PriceText amount={linePrice} style={[styles.cellNum, styles.colLine]} />
                </View>
              )
            })}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{fixPdfHebrew('סכום ביניים')}</Text>
              <PriceText amount={summary.subtotal} style={styles.summaryValue} />
            </View>
            {summary.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{fixPdfHebrew('הנחה')}</Text>
                <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                  <Text style={{ fontFamily: H }}>{fixPdfHebrew('₪-')}</Text>
                  <Text style={{ fontFamily: L }}>
                    {fixPdfHebrew(summary.discount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}
                  </Text>
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{fixPdfHebrew('לפני מע"מ')}</Text>
              <PriceText amount={summary.totalBeforeVAT} style={styles.summaryValue} />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{fixPdfHebrew('מע"מ 17%')}</Text>
              <PriceText amount={summary.vat} style={styles.summaryValue} />
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>{fixPdfHebrew('סה"כ לתשלום')}</Text>
              <PriceText amount={summary.totalWithVAT} style={styles.summaryTotalValue} />
            </View>
          </View>
        </View>

        {/* Payment terms */}
        {quote.paymentTerms && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', fontFamily: H, direction: 'rtl', textAlign: 'right' }}>
              {fixPdfHebrew('תנאי תשלום: ')}
              <Text style={{ color: '#111827', fontFamily: H, direction: 'rtl' }}>{fixPdfHebrew(quote.paymentTerms)}</Text>
            </Text>
          </View>
        )}

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notesBox}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#92400E', marginBottom: 3, fontFamily: H, direction: 'rtl', textAlign: 'right' }}>{fixPdfHebrew('הערות:')}</Text>
            <Text style={styles.notesText}>{fixPdfHebrew(quote.notes)}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{fixPdfHebrew('הצעת מחיר ')}{fixPdfHebrew(quote.quoteNumber)}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => fixPdfHebrew(`עמוד ${pageNumber} / ${totalPages}`)} />
        </View>
      </Page>
    </Document>
  )
}
