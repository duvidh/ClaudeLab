import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const employees = await prisma.employee.findMany({
      where: status ? { status } : undefined,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: employees })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת עובדים' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { startDate, wageAmount, ...rest } = body
    const employee = await prisma.employee.create({
      data: {
        ...rest,
        wageAmount: wageAmount !== '' && wageAmount != null ? parseFloat(String(wageAmount)) : 0,
        startDate: startDate ? new Date(startDate) : null,
      },
    })
    return NextResponse.json({ data: employee }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה ביצירת עובד' }, { status: 500 })
  }
}
