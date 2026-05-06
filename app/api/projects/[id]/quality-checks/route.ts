import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const qualityChecks = await prisma.qualityCheck.findMany({
      where: { projectId: id },
      include: {
        inspector: { select: { id: true, name: true } },
        ncrs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: qualityChecks })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת בדיקות האיכות' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, checklistItems, inspectorId, notes } = body
    const qualityCheck = await prisma.qualityCheck.create({
      data: {
        projectId: id,
        title,
        checklistItems: checklistItems !== undefined
          ? (typeof checklistItems === 'string' ? checklistItems : JSON.stringify(checklistItems))
          : '[]',
        status: 'PENDING',
        inspectorId: inspectorId ?? null,
        notes: notes ?? null,
      },
      include: {
        inspector: { select: { id: true, name: true } },
        ncrs: true,
      },
    })
    return NextResponse.json({ data: qualityCheck }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת בדיקת איכות' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const checkId = searchParams.get('checkId')
    if (!checkId) {
      return NextResponse.json({ error: 'נדרש מזהה בדיקת איכות' }, { status: 400 })
    }
    const body = await req.json()
    const { status, checklistItems, notes } = body
    const data: Record<string, unknown> = {}
    if (status !== undefined) data.status = status
    if (notes !== undefined) data.notes = notes
    if (checklistItems !== undefined) {
      data.checklistItems = typeof checklistItems === 'string'
        ? checklistItems
        : JSON.stringify(checklistItems)
    }

    const qualityCheck = await prisma.qualityCheck.update({
      where: { id: checkId, projectId: id },
      data,
      include: {
        inspector: { select: { id: true, name: true } },
        ncrs: { orderBy: { createdAt: 'desc' } },
      },
    })
    return NextResponse.json({ data: qualityCheck })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון בדיקת איכות' }, { status: 500 })
  }
}
