import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const projects = await prisma.project.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
        ...(search ? { OR: [{ name: { contains: search } }, { address: { contains: search } }] } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        payments: { select: { amount: true } },
        _count: { select: { milestones: true, tasks: true, quotes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: projects })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בטעינת הפרויקטים' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const project = await prisma.project.create({ data: body })
    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה ביצירת הפרויקט' }, { status: 500 })
  }
}
