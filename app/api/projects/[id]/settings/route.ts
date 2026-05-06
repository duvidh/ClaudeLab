import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const settings = await prisma.projectSettings.upsert({
      where: { projectId: id },
      update: {},
      create: {
        projectId: id,
        enableQC: false,
        enableRisks: false,
        enableChangeRequests: false,
        enableMilestones: true,
      },
    })
    return NextResponse.json({ data: settings })
  } catch {
    return NextResponse.json({ error: 'שגיאה בטעינת הגדרות הפרויקט' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { enableQC, enableRisks, enableChangeRequests, enableMilestones } = body
    const data: Record<string, boolean> = {}
    if (enableQC !== undefined) data.enableQC = enableQC
    if (enableRisks !== undefined) data.enableRisks = enableRisks
    if (enableChangeRequests !== undefined) data.enableChangeRequests = enableChangeRequests
    if (enableMilestones !== undefined) data.enableMilestones = enableMilestones

    const settings = await prisma.projectSettings.upsert({
      where: { projectId: id },
      update: data,
      create: {
        projectId: id,
        enableQC: enableQC ?? false,
        enableRisks: enableRisks ?? false,
        enableChangeRequests: enableChangeRequests ?? false,
        enableMilestones: enableMilestones ?? true,
      },
    })
    return NextResponse.json({ data: settings })
  } catch {
    return NextResponse.json({ error: 'שגיאה בעדכון הגדרות הפרויקט' }, { status: 500 })
  }
}
