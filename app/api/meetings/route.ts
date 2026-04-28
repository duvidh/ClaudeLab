import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')
    const clientId = searchParams.get('clientId')

    const meetings = await prisma.meeting.findMany({
      where: {
        ...(leadId ? { leadId } : {}),
        ...(clientId ? { clientId } : {}),
      },
      include: {
        lead: { select: { id: true, fullName: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ data: meetings })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת פגישות' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const meeting = await prisma.meeting.create({
      data: {
        ...body,
        date: new Date(body.date),
      },
      include: {
        lead: { select: { id: true, fullName: true } },
        client: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: meeting }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה ביצירת פגישה' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    await prisma.meeting.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת פגישה' }, { status: 500 })
  }
}
