import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'

let cache400: Buffer | null = null
let cache700: Buffer | null = null

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const bold = searchParams.get('bold') === '1'

  if (bold && cache700) return fontResponse(cache700)
  if (!bold && cache400) return fontResponse(cache400)

  const weight = bold ? '700' : '400'
  const file = readFileSync(
    path.join(process.cwd(), 'node_modules', '@fontsource', 'heebo', 'files', `heebo-latin-${weight}-normal.woff2`)
  )

  if (bold) cache700 = file
  else cache400 = file

  return fontResponse(file)
}

function fontResponse(buf: Buffer) {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'font/woff2',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
