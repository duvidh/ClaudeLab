export type QuoteItemInput = {
  dimension1?: number | null
  dimension2?: number | null
  unitPrice: number
  materialsCost: number
  transportCost: number
  laborCost: number
}

export function calcLinePrice(item: QuoteItemInput): number {
  const d1 = item.dimension1 ?? 1
  const d2 = item.dimension2 ?? 1
  return d1 * d2 * item.unitPrice
}

export function calcElementCost(item: QuoteItemInput): number {
  return item.materialsCost + item.transportCost + item.laborCost
}

export function calcProfitPercent(linePrice: number, elementCost: number): number {
  if (linePrice <= 0) return 0
  return ((linePrice - elementCost) / linePrice) * 100
}

export type QuoteSummary = {
  subtotal: number
  discount: number
  totalBeforeVAT: number
  vat: number
  totalWithVAT: number
}

export function calcQuoteSummary(
  items: QuoteItemInput[],
  discount: number = 0
): QuoteSummary {
  const subtotal = items.reduce((sum, item) => sum + calcLinePrice(item), 0)
  const totalBeforeVAT = Math.max(0, subtotal - discount)
  const vat = totalBeforeVAT * 0.17
  const totalWithVAT = totalBeforeVAT + vat
  return { subtotal, discount, totalBeforeVAT, vat, totalWithVAT }
}

export type ClientFinancials = {
  totalContracts: number
  totalPaid: number
  balance: number
}

export function calcClientFinancials(
  contractValues: number[],
  payments: number[]
): ClientFinancials {
  const totalContracts = contractValues.reduce((s, v) => s + v, 0)
  const totalPaid = payments.reduce((s, v) => s + v, 0)
  return { totalContracts, totalPaid, balance: totalContracts - totalPaid }
}
