import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

const UPLOADS_DIR = join(process.cwd(), "public", "uploads")
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
]

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPG, and PNG files are allowed" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const extension = file.name.split(".").pop()
    const filename = `${uuidv4()}.${extension}`
    const filepath = join(UPLOADS_DIR, filename)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save file
    await writeFile(filepath, buffer)

    // Return file URL
    const fileUrl = `/uploads/${filename}`

    return NextResponse.json({
      url: fileUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
} 