import { NextRequest, NextResponse } from 'next/server'
import { convertLeadToClient } from '@/lib/converters'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await convertLeadToClient(id)
    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'שגיאה בהמרת הליד'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
