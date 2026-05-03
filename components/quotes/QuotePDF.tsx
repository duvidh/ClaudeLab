'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import { calcLinePrice, calcQuoteSummary } from '@/lib/calculations'

// הפונטים המקומיים שלנו
Font.register({
  family: 'Heebo',
  fonts: [
    { src: '/fonts/Heebo-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Heebo-Bold.ttf', fontWeight: 700 },
  ],
})

const FONT_FAMILY = 'Heebo'

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
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
  companyName: { fontSize: 20, fontWeight: 700, color: '#1E40AF', textAlign: 'right' },
  companyInfo: { fontSize: 8, color: '#6B7280', marginTop: 2, textAlign: 'right' },
  quoteTitle: { fontSize: 18, fontWeight: 700, color: '#111827', textAlign: 'right' },
  quoteMeta: { fontSize: 9, color: '#6B7280', textAlign: 'right', marginTop: 3 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#111827', marginBottom: 8, textAlign: 'right' },
  clientBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientRow: { flexDirection: 'row-reverse', gap: 4, marginBottom: 2 },
  clientLabel: { fontSize: 9, color: '#6B7280', width: 60, textAlign: 'right' },
  clientValue: { fontSize: 9, color: '#111827', textAlign: 'right' },
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#1E3A5F',
    padding: '6 4',
    borderRadius: 2,
  },
  tableHeaderCell: { color: '#FFFFFF', fontSize: 8, fontWeight: 700, textAlign: 'right' },
  tableRow: {
    flexDirection: 'row-reverse',
    padding: '5 4',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  cell: { fontSize: 8, color: '#374151', textAlign: 'right' },
  cellNum: { fontSize: 8, color: '#374151', textAlign: 'right' },
  colSeq: { width: '5%' },
  colName: { width: '28%' },
  colDim: { width: '14%' },
  colUnit: { width: '8%' },
  colPrice: { width: '17%' },
  colLine: { width: '18%' },
  summarySection: { marginTop: 16, flexDirection: 'row-reverse', justifyContent: 'flex-end' },
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
  summaryLabel: { fontSize: 9, color: '#6B7280', textAlign: 'right' },
  summaryValue: { fontSize: 9, color: '#111827', textAlign: 'left' },
  summaryTotalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: '7 10',
    backgroundColor: '#1E3A5F',
  },
  summaryTotalLabel: { fontSize: 10, color: '#FFFFFF', fontWeight: 700, textAlign: 'right' },
  summaryTotalValue: { fontSize: 10, color: '#FFFFFF', fontWeight: 700, textAlign: 'left' },
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
  footerText: { fontSize: 8, color: '#9CA3AF', textAlign: 'right' },
  notesBox: {
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    padding: 8,
  },
  notesText: { fontSize: 8, color: '#92400E', textAlign: 'right' },
})

function PriceText({ amount, style }: { amount: number; style?: Style | Style[] }) {
  const num = amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <Text style={style}>
      <Text>₪ {num}</Text>
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
  // מעדכנים את הטיפוסים כדי שיתמכו גם בלקוח וגם בליד
  client?: { name: string; address?: string | null; email?: string | null } | null
  lead?: { fullName: string; email?: string | null } | null
  project?: { name: string } | null
  items: QuoteItem[]
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('he-IL')
}

export function QuotePDFDocument({ quote, companyName }: { quote: QuoteData; companyName?: string }) {
  const summary = calcQuoteSummary(quote.items, quote.discount)

  // שליפת הנתונים בצורה בטוחה: אם יש לקוח ניקח ממנו, אם אין נחפש בליד
  const targetName = quote.client?.name || quote.lead?.fullName || 'לקוח מזדמן'
  const targetEmail = quote.client?.email || quote.lead?.email
  const targetAddress = quote.client?.address

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName || 'חברת הבנייה'}</Text>
            <Text style={styles.companyInfo}>קבלן שיפוצים ובנייה</Text>
          </View>
          <View>
            <Text style={styles.quoteTitle}>הצעת מחיר</Text>
            <Text style={styles.quoteMeta}>מספר: {quote.quoteNumber}</Text>
            <Text style={styles.quoteMeta}>תאריך: {fmtDate(quote.date)}</Text>
            {quote.validUntil && (
              <Text style={styles.quoteMeta}>בתוקף עד: {fmtDate(quote.validUntil)}</Text>
            )}
            <Text style={styles.quoteMeta}>גרסה: v{quote.version}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטי לקוח</Text>
          <View style={styles.clientBox}>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>שם:</Text>
              <Text style={styles.clientValue}>{targetName}</Text>
            </View>
            {targetAddress && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>כתובת:</Text>
                <Text style={styles.clientValue}>{targetAddress}</Text>
              </View>
            )}
            {targetEmail && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>אימייל:</Text>
                <Text style={styles.clientValue}>{targetEmail}</Text>
              </View>
            )}
            {quote.project && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>פרויקט:</Text>
                <Text style={styles.clientValue}>{quote.project.name}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פירוט עבודות וחומרים</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colSeq]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.colName]}>תיאור</Text>
              <Text style={[styles.tableHeaderCell, styles.colDim]}>מידות</Text>
              <Text style={[styles.tableHeaderCell, styles.colUnit]}>יחידה</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>מחיר יחידה</Text>
              <Text style={[styles.tableHeaderCell, styles.colLine]}>סה"כ שורה</Text>
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
                  <Text style={[styles.cellNum, styles.colSeq]}>{item.sequenceNumber}</Text>
                  <Text style={[styles.cell, styles.colName]}>{item.productName}</Text>
                  <Text style={[styles.cellNum, styles.colDim]}>{dimText}</Text>
                  <Text style={[styles.cell, styles.colUnit]}>{item.unit ?? ''}</Text>
                  <PriceText amount={item.unitPrice} style={[styles.cellNum, styles.colPrice]} />
                  <PriceText amount={linePrice} style={[styles.cellNum, styles.colLine]} />
                </View>
              )
            })}
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>סכום ביניים</Text>
              <PriceText amount={summary.subtotal} style={styles.summaryValue} />
            </View>
            {summary.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>הנחה</Text>
                <Text style={[styles.summaryValue, { color: '#DC2626' }]}>
                  ₪- {summary.discount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>לפני מע"מ</Text>
              <PriceText amount={summary.totalBeforeVAT} style={styles.summaryValue} />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>מע"מ 17%</Text>
              <PriceText amount={summary.vat} style={styles.summaryValue} />
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>סה"כ לתשלום</Text>
              <PriceText amount={summary.totalWithVAT} style={styles.summaryTotalValue} />
            </View>
          </View>
        </View>

        {quote.paymentTerms && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', textAlign: 'right' }}>
              תנאי תשלום: <Text style={{ color: '#111827' }}>{quote.paymentTerms}</Text>
            </Text>
          </View>
        )}

        {quote.notes && (
          <View style={styles.notesBox}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: '#92400E', marginBottom: 3, textAlign: 'right' }}>הערות:</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>הצעת מחיר {quote.quoteNumber}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `עמוד ${pageNumber} מתוך ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
