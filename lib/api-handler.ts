import { NextRequest, NextResponse } from 'next/server'

type ParamsContext = { params: Promise<{ id: string }> }

type ApiHandlerCallback = (args: {
  req: NextRequest
  id: string
}) => Promise<NextResponse>

export async function withApiHandler(
  req: NextRequest,
  context: ParamsContext,
  onSuccess: ApiHandlerCallback,
  errorMessage: string,
  logError = false
) {
  try {
    const { id } = await context.params
    return await onSuccess({ req, id })
  } catch (error) {
    if (logError) {
      console.error(error)
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
