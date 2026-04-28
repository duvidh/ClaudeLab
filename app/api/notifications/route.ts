import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const unreadCount = await prisma.notification.count({ where: { isRead: false } })
    return NextResponse.json({ data: notifications, unreadCount })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בטעינת התראות' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const notification = await prisma.notification.create({ data: body })
    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה ביצירת התראה' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, markAllRead } = await req.json()
    if (markAllRead) {
      await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } })
      return NextResponse.json({ success: true })
    }
    if (id) {
      const n = await prisma.notification.update({ where: { id }, data: { isRead: true } })
      return NextResponse.json({ data: n })
    }
    return NextResponse.json({ error: 'חסר מזהה' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון התראה' }, { status: 500 })
  }
}
