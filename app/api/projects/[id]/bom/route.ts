import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bomItems = await prisma.bOMItem.findMany({
      where: { projectId: id },
      include: {
        supplier: { select: { id: true, name: true } },
        workPackage: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: bomItems })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת רשימת החומרים' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { description, quantity, unit, unitPrice, partNumber, status, supplierId, workPackageId } = body
    if (!description) {
      return NextResponse.json({ error: 'תיאור פריט חובה' }, { status: 400 })
    }
    const bomItem = await prisma.bOMItem.create({
      data: {
        projectId: id,
        description,
        quantity: quantity ?? 1,
        unit: unit ?? null,
        unitPrice: unitPrice ?? null,
        partNumber: partNumber ?? null,
        status: status ?? 'REQUIRED',
        supplierId: supplierId ?? null,
        workPackageId: workPackageId ?? null,
      },
      include: {
        supplier: { select: { id: true, name: true } },
        workPackage: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: bomItem }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת פריט ברשימת החומרים' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { id: itemId, description, quantity, unit, unitPrice, partNumber, status, supplierId, workPackageId } = body
    if (!itemId) {
      return NextResponse.json({ error: 'נדרש מזהה פריט' }, { status: 400 })
    }
    const data: Record<string, unknown> = {}
    if (description !== undefined) data.description = description
    if (quantity !== undefined) data.quantity = quantity
    if (unit !== undefined) data.unit = unit
    if (unitPrice !== undefined) data.unitPrice = unitPrice
    if (partNumber !== undefined) data.partNumber = partNumber
    if (status !== undefined) data.status = status
    if (supplierId !== undefined) data.supplierId = supplierId
    if (workPackageId !== undefined) data.workPackageId = workPackageId

    const bomItem = await prisma.bOMItem.update({
      where: { id: itemId, projectId: id },
      data,
      include: {
        supplier: { select: { id: true, name: true } },
        workPackage: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: bomItem })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון פריט ברשימת החומרים' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) {
      return NextResponse.json({ error: 'נדרש מזהה פריט' }, { status: 400 })
    }
    await prisma.bOMItem.delete({ where: { id: itemId, projectId: id } })
    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'שגיאה במחיקת הפריט' }, { status: 500 })
  }
}
