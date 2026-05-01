import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

type EntityFolder = 'projects' | 'leads' | 'clients'

export async function saveFileToDisk(file: File, folder: EntityFolder, entityId: string) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Create a unique filename to prevent overwriting
  const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder, entityId)

  // Ensure directory exists
  await mkdir(uploadDir, { recursive: true })

  const filePath = path.join(uploadDir, uniqueName)
  await writeFile(filePath, buffer)

  return {
    name: file.name,
    url: `/uploads/${folder}/${entityId}/${uniqueName}`,
    type: file.type
  }
}

export async function deleteFileFromDisk(fileUrl: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', fileUrl)
    await unlink(filePath)
    return true
  } catch (error) {
    console.error("Failed to delete file from disk:", error)
    return false
  }
}
