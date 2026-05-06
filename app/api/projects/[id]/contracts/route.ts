import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const contracts = await prisma.contract.findMany({
      where: { projectId: id },
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: contracts })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת החוזים' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { title, contractType, totalValue, status, supplierId, signedDate, startDate, endDate, notes } = body
    if (!title) {
      return NextResponse.json({ error: 'כותרת חוזה חובה' }, { status: 400 })
    }
    const contract = await prisma.contract.create({
      data: {
        projectId: id,
        title,
        contractType: contractType ?? 'FIXED_PRICE',
        totalValue: totalValue ?? 0,
        status: status ?? 'DRAFT',
        supplierId: supplierId ?? null,
        signedDate: signedDate ? new Date(signedDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes: notes ?? null,
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: contract }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת החוזה' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { id: contractId, title, contractType, totalValue, status, supplierId, signedDate, startDate, endDate, notes } = body
    if (!contractId) {
      return NextResponse.json({ error: 'נדרש מזהה חוזה' }, { status: 400 })
    }
    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title
    if (contractType !== undefined) data.contractType = contractType
    if (totalValue !== undefined) data.totalValue = totalValue
    if (status !== undefined) data.status = status
    if (supplierId !== undefined) data.supplierId = supplierId
    if (signedDate !== undefined) data.signedDate = signedDate ? new Date(signedDate) : null
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
    if (notes !== undefined) data.notes = notes

    const contract = await prisma.contract.update({
      where: { id: contractId, projectId: id },
      data,
      include: {
        supplier: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: contract })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון החוזה' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const contractId = searchParams.get('contractId')
    if (!contractId) {
      return NextResponse.json({ error: 'נדרש מזהה חוזה' }, { status: 400 })
    }
    await prisma.contract.delete({ where: { id: contractId, projectId: id } })
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'שגיאה במחיקת החוזה' }, { status: 500 })
  }
}
