import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === 'true'

    const suppliers = await prisma.supplier.findMany({
      where: all ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: suppliers })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת הספקים' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, contactName, email, phone, address, category, notes } = body
    if (!name) {
      return NextResponse.json({ error: 'שם ספק חובה' }, { status: 400 })
    }
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName: contactName ?? null,
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? null,
        category: category ?? null,
        notes: notes ?? null,
      },
    })
    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת הספק' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, qualityScore, deliveryScore, financialScore, technicalScore, ...rest } = body
    if (!id) {
      return NextResponse.json({ error: 'נדרש מזהה ספק' }, { status: 400 })
    }

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

    const merged = {
      qualityScore: qualityScore !== undefined ? qualityScore : current?.qualityScore,
      deliveryScore: deliveryScore !== undefined ? deliveryScore : current?.deliveryScore,
      financialScore: financialScore !== undefined ? financialScore : current?.financialScore,
      technicalScore: technicalScore !== undefined ? technicalScore : current?.technicalScore,
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'נדרש מזהה ספק' }, { status: 400 })
    }
    await prisma.supplier.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'שגיאה במחיקת הספק' }, { status: 500 })
  }
}
