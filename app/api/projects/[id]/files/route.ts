import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'other'

    if (!file) return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 })

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'projects', id)
    await mkdir(uploadsDir, { recursive: true })

    const safeFilename = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`
    await writeFile(path.join(uploadsDir, safeFilename), Buffer.from(await file.arrayBuffer()))

    const projectFile = await prisma.projectFile.create({
      data: {
        projectId: id,
        name: file.name,
        url: `/uploads/projects/${id}/${safeFilename}`,
        fileType: type,
      },
    })
    return NextResponse.json({ data: projectFile }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'שגיאה בהעלאת הקובץ' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { fileId } = await req.json()
    const file = await prisma.projectFile.findUnique({ where: { id: fileId } })
    if (!file || file.projectId !== id) {
      return NextResponse.json({ error: 'קובץ לא נמצא' }, { status: 404 })
    }
    try {
      await unlink(path.join(process.cwd(), 'public', file.url))
    } catch {}
    await prisma.projectFile.delete({ where: { id: fileId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'שגיאה במחיקת הקובץ' }, { status: 500 })
  }
}
