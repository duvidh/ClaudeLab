import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { content, author } = await req.json()
    const note = await prisma.leadNote.create({
      data: { leadId: id, content, author: author || 'נציג' },
    })
    return NextResponse.json({ data: note }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'שגיאה בהוספת הערה' }, { status: 500 })
  }
}
