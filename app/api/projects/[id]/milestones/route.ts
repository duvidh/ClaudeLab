import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const count = await prisma.milestone.count({ where: { projectId: id } })
    const milestone = await prisma.milestone.create({
      data: { ...body, projectId: id, order: count },
    })
    return NextResponse.json({ data: milestone }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה ביצירת אבן דרך' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { milestoneId, ...data } = await req.json()
    const milestone = await prisma.milestone.update({
      where: { id: milestoneId, projectId },
      data,
    })
    return NextResponse.json({ data: milestone })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה בעדכון אבן דרך' }, { status: 500 })
  }
}
