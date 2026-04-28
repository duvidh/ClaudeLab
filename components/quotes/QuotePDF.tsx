'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { calcLinePrice, calcQuoteSummary } from '@/lib/calculations'

// Register a font with Hebrew support (using a system fallback path won't work in browser,
// so we use the built-in Helvetica which handles Latin — Hebrew characters render via unicode fallback)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  companyName: { fontSize: 20, fontWeight: 'bold', color: '#1E40AF' },
  companyInfo: { fontSize: 8, color: '#6B7280', marginTop: 2 },
  quoteTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'right' },
  quoteMeta: { fontSize: 9, color: '#6B7280', textAlign: 'right', marginTop: 3 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  clientBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clientRow: { flexDirection: 'row-reverse', gap: 4, marginBottom: 2 },
  clientLabel: { fontSize: 9, color: '#6B7280', width: 60 },
  clientValue: { fontSize: 9, color: '#111827' },
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#1E3A5F',
    padding: '6 4',
    borderRadius: 2,
  },
  tableHeaderCell: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row-reverse',
    padding: '5 4',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  cell: { fontSize: 8, color: '#374151', textAlign: 'right' },
  colSeq: { width: '5%' },
  colName: { width: '28%' },
  colDim: { width: '14%' },
  colUnit: { width: '8%' },
  colQty: { width: '10%' },
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
  summaryLabel: { fontSize: 9, color: '#6B7280' },
  summaryValue: { fontSize: 9, color: '#111827' },
  summaryTotalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    padding: '7 10',
    backgroundColor: '#1E3A5F',
  },
  summaryTotalLabel: { fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' },
  summaryTotalValue: { fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' },
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
  footerText: { fontSize: 8, color: '#9CA3AF' },
  notesBox: {
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    padding: 8,
  },
  notesText: { fontSize: 8, color: '#92400E' },
})

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

function fmt(n: number) {
  return `₪${n.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('he-IL')
}

export function QuotePDFDocument({ quote }: { quote: QuoteData }) {
  const summary = calcQuoteSummary(quote.items, quote.discount)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>חברת הבנייה</Text>
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

        {/* Client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטי לקוח</Text>
          <View style={styles.clientBox}>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>שם:</Text>
              <Text style={styles.clientValue}>{quote.client.name}</Text>
            </View>
            {quote.client.address && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>כתובת:</Text>
                <Text style={styles.clientValue}>{quote.client.address}</Text>
              </View>
            )}
            {quote.client.email && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>אימייל:</Text>
                <Text style={styles.clientValue}>{quote.client.email}</Text>
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

        {/* Items table */}
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
                  <Text style={[styles.cell, styles.colSeq]}>{item.sequenceNumber}</Text>
                  <Text style={[styles.cell, styles.colName]}>{item.productName}</Text>
                  <Text style={[styles.cell, styles.colDim]}>{dimText}</Text>
                  <Text style={[styles.cell, styles.colUnit]}>{item.unit ?? ''}</Text>
                  <Text style={[styles.cell, styles.colPrice]}>{fmt(item.unitPrice)}</Text>
                  <Text style={[styles.cell, styles.colLine]}>{fmt(linePrice)}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>סכום ביניים</Text>
              <Text style={styles.summaryValue}>{fmt(summary.subtotal)}</Text>
            </View>
            {summary.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>הנחה</Text>
                <Text style={[styles.summaryValue, { color: '#DC2626' }]}>-{fmt(summary.discount)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>לפני מע"מ</Text>
              <Text style={styles.summaryValue}>{fmt(summary.totalBeforeVAT)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>מע"מ 17%</Text>
              <Text style={styles.summaryValue}>{fmt(summary.vat)}</Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>סה"כ לתשלום</Text>
              <Text style={styles.summaryTotalValue}>{fmt(summary.totalWithVAT)}</Text>
            </View>
          </View>
        </View>

        {/* Payment terms */}
        {quote.paymentTerms && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 9, color: '#6B7280' }}>
              תנאי תשלום: <Text style={{ color: '#111827' }}>{quote.paymentTerms}</Text>
            </Text>
          </View>
        )}

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notesBox}>
            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#92400E', marginBottom: 3 }}>הערות:</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>הצעת מחיר {quote.quoteNumber}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `עמוד ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
