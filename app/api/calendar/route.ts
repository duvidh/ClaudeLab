import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)

    const [meetings, tasks, projects] = await Promise.all([
      prisma.meeting.findMany({
        where: { date: { gte: start, lte: end } },
        include: {
          lead: { select: { id: true, fullName: true } },
          client: { select: { id: true, name: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.task.findMany({
        where: {
          dueDate: { gte: start, lte: end },
          status: { not: 'DONE' },
        },
        include: {
          client: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { startDate: { gte: start, lte: end } },
            { plannedEndDate: { gte: start, lte: end } },
          ],
        },
        select: { id: true, name: true, startDate: true, plannedEndDate: true, status: true },
      }),
    ])

    return NextResponse.json({ data: { meetings, tasks, projects } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בטעינת הלוח שנה' }, { status: 500 })
  }
}
