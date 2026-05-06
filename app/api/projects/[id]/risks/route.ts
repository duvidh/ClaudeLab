import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const risks = await prisma.risk.findMany({
      where: { projectId: id },
      include: {
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: risks })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת הסיכונים' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, description, probability, impact, mitigation, status, ownerId } = body
    const risk = await prisma.risk.create({
      data: {
        projectId: id,
        title,
        description,
        probability: probability ?? 'MEDIUM',
        impact: impact ?? 'MEDIUM',
        mitigation,
        status: status ?? 'IDENTIFIED',
        ownerId: ownerId ?? null,
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: risk }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת סיכון' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const riskId = searchParams.get('riskId')
    if (!riskId) {
      return NextResponse.json({ error: 'נדרש מזהה סיכון' }, { status: 400 })
    }
    await prisma.risk.delete({ where: { id: riskId, projectId: id } })
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'שגיאה במחיקת הסיכון' }, { status: 500 })
  }
}
