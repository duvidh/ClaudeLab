import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BOM_INCLUDE = {
  supplier: { select: { id: true, name: true } },
  workPackage: { select: { id: true, name: true } },
  catalogItem: { select: { id: true, name: true, sku: true } },
} as const

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bomItems = await prisma.bOMItem.findMany({
      where: { projectId: id },
      include: BOM_INCLUDE,
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ data: bomItems })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת רשימת החומרים' }, { status: 500 })
  }
}

async function resolveCatalogItemId(
  providedId: string | undefined,
  description: string,
  unit: string | undefined,
  unitPrice: number | undefined,
): Promise<string | null> {
  if (providedId) return providedId
  const existing = await prisma.catalogItem.findFirst({
    where: { name: description, isActive: true },
  })
  if (existing) return existing.id
  const created = await prisma.catalogItem.create({
    data: {
      name: description,
      unit: unit ?? null,
      salePrice: unitPrice ?? 0,
      isActive: true,
    },
  })
  return created.id
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { description, quantity, unit, unitPrice, partNumber, status, supplierId, workPackageId, catalogItemId } = body
    if (!description) {
      return NextResponse.json({ error: 'תיאור פריט חובה' }, { status: 400 })
    }
    const resolvedCatalogItemId = await resolveCatalogItemId(catalogItemId, description, unit, unitPrice)
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
        catalogItemId: resolvedCatalogItemId,
      },
      include: BOM_INCLUDE,
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
    const { id: itemId, description, quantity, unit, unitPrice, partNumber, status, supplierId, workPackageId, catalogItemId } = body
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
    if (catalogItemId !== undefined) data.catalogItemId = catalogItemId

    const bomItem = await prisma.bOMItem.update({
      where: { id: itemId, projectId: id },
      data,
      include: BOM_INCLUDE,
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
