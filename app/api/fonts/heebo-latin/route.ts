import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

type CachedFont = { file: Buffer; contentType: 'font/ttf' | 'font/woff' }

let cache400: CachedFont | null = null
let cache700: CachedFont | null = null

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const bold = searchParams.get('bold') === '1'

  if (bold && cache700) return fontResponse(cache700.file, cache700.contentType)
  if (!bold && cache400) return fontResponse(cache400.file, cache400.contentType)

  const weight = bold ? '700' : '400'
  const { file, contentType } = readFontFile(`heebo-latin-${weight}-normal`)

  if (bold) cache700 = { file, contentType }
  else cache400 = { file, contentType }

  return fontResponse(file, contentType)
}

function readFontFile(fontBaseName: string): { file: Buffer; contentType: 'font/ttf' | 'font/woff' } {
  const filesDir = path.join(process.cwd(), 'node_modules', '@fontsource', 'heebo', 'files')
  const candidates: Array<{ ext: 'ttf' | 'woff'; contentType: 'font/ttf' | 'font/woff' }> = [
    { ext: 'ttf', contentType: 'font/ttf' },
    { ext: 'woff', contentType: 'font/woff' },
  ]

  for (const candidate of candidates) {
    const filePath = path.join(filesDir, `${fontBaseName}.${candidate.ext}`)
    if (existsSync(filePath)) {
      return { file: readFileSync(filePath), contentType: candidate.contentType }
    }
  }

  throw new Error(`No supported font file found for ${fontBaseName}. Tried .ttf and .woff in @fontsource/heebo/files.`)
}

function fontResponse(buf: Buffer, contentType: 'font/ttf' | 'font/woff') {
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
