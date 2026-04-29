import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employee = await prisma.employee.findUnique({ where: { id } })
    if (!employee) return NextResponse.json({ error: 'עובד לא נמצא' }, { status: 404 })
    return NextResponse.json({ data: employee })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת עובד' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { startDate, wageAmount, ...rest } = body
    const data: Record<string, unknown> = { ...rest }
    if ('startDate' in body) data.startDate = startDate ? new Date(startDate) : null
    if ('wageAmount' in body) {
      data.wageAmount = wageAmount !== '' && wageAmount != null ? parseFloat(String(wageAmount)) : 0
    }
    const employee = await prisma.employee.update({ where: { id }, data })
    return NextResponse.json({ data: employee })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון עובד' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.employee.delete({ where: { id } })
    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת עובד' }, { status: 500 })
  }
}
