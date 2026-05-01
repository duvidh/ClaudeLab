import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler } from '@/lib/api-handler'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    _req,
    { params },
    async ({ id }) => {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
        meetings: { orderBy: { date: 'desc' } },
        files: true,
        tasks: { orderBy: { createdAt: 'desc' } },
        client: true,
      },
    })
    if (!lead) return NextResponse.json({ error: 'ליד לא נמצא' }, { status: 404 })
    return NextResponse.json({ data: lead })
    },
    'שגיאה בטעינת הליד',
    true
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    req,
    { params },
    async ({ req, id }) => {
      const body = await req.json()

      // Form inputs send Float fields as strings — coerce before Prisma
      const data: Record<string, unknown> = { ...body }
      if ('estimatedSize' in data) {
        const v = data.estimatedSize
        data.estimatedSize = v !== '' && v != null ? parseFloat(String(v)) : null
      }
      if ('budget' in data) {
        const v = data.budget
        data.budget = v !== '' && v != null ? parseFloat(String(v)) : null
      }

      const lead = await prisma.lead.update({ where: { id }, data })
      return NextResponse.json({ data: lead })
    },
    'שגיאה בעדכון הליד'
  )
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiHandler(
    _req,
    { params },
    async ({ id }) => {
      await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } })
      return NextResponse.json({ data: { success: true } })
    },
    'שגיאה במחיקת הליד'
  )
}
