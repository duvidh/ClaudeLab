import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bomItems: true, contracts: true },
        },
      },
    })
    if (!supplier) {
      return NextResponse.json({ error: 'ספק לא נמצא' }, { status: 404 })
    }
    return NextResponse.json({ data: supplier })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת הספק' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { qualityScore, deliveryScore, financialScore, technicalScore, ...rest } = body

    const data: Record<string, unknown> = { ...rest }
    if (qualityScore !== undefined) data.qualityScore = qualityScore
    if (deliveryScore !== undefined) data.deliveryScore = deliveryScore
    if (financialScore !== undefined) data.financialScore = financialScore
    if (technicalScore !== undefined) data.technicalScore = technicalScore

    // Fetch current supplier to merge with new scores for overall calculation
    const current = await prisma.supplier.findUnique({
      where: { id },
      select: { qualityScore: true, deliveryScore: true, financialScore: true, technicalScore: true },
    })
    if (!current) {
      return NextResponse.json({ error: 'ספק לא נמצא' }, { status: 404 })
    }

    const merged = {
      qualityScore: qualityScore !== undefined ? qualityScore : current.qualityScore,
      deliveryScore: deliveryScore !== undefined ? deliveryScore : current.deliveryScore,
      financialScore: financialScore !== undefined ? financialScore : current.financialScore,
      technicalScore: technicalScore !== undefined ? technicalScore : current.technicalScore,
    }

    const scores = [merged.qualityScore, merged.deliveryScore, merged.financialScore, merged.technicalScore].filter(
      (s): s is number => s != null
    )
    data.overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null

    const supplier = await prisma.supplier.update({ where: { id }, data })
    return NextResponse.json({ data: supplier })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון הספק' }, { status: 500 })
  }
}
