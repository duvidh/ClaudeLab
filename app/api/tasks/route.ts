import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    const tasks = await prisma.task.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
      include: {
        lead: { select: { id: true, fullName: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ data: tasks })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת המשימות' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const task = await prisma.task.create({ data: body })
    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה ביצירת המשימה' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    const task = await prisma.task.update({ where: { id }, data })
    return NextResponse.json({ data: task })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון המשימה' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'חסר מזהה משימה' }, { status: 400 })
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת המשימה' }, { status: 500 })
  }
}
