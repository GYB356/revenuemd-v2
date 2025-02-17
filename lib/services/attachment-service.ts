import { supabase } from "@/lib/supabase"
import { prisma } from "@/lib/db"

export interface Attachment {
  name: string
  url: string
  type: string
  size: number
  uploadDate: Date
}

export interface AttachmentUploadParams {
  file: File
  entityType: "CLAIM" | "MEDICAL_RECORD"
  entityId: string
  userId: string
}

export interface AttachmentDeleteParams {
  fileName: string
  entityType: "CLAIM" | "MEDICAL_RECORD"
  entityId: string
  userId: string
}

export class AttachmentService {
  private static BUCKET_NAME = "attachments"

  static async upload({ file, entityType, entityId, userId }: AttachmentUploadParams): Promise<Attachment> {
    const fileExt = file.name.split(".").pop()
    const fileName = `${entityType.toLowerCase()}/${entityId}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file)

    if (uploadError) {
      console.error("Failed to upload file:", uploadError)
      throw new Error("Failed to upload file")
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName)

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        entityType,
        entityId,
        uploadedBy: userId,
      },
    })

    return {
      name: attachment.name,
      url: attachment.url,
      type: attachment.type,
      size: attachment.size,
      uploadDate: attachment.createdAt,
    }
  }

  static async delete({ fileName, entityType, entityId, userId }: AttachmentDeleteParams): Promise<void> {
    // Get attachment record
    const attachment = await prisma.attachment.findFirst({
      where: {
        name: fileName,
        entityType,
        entityId,
      },
    })

    if (!attachment) {
      throw new Error("Attachment not found")
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([`${entityType.toLowerCase()}/${entityId}/${fileName}`])

    if (deleteError) {
      console.error("Failed to delete file:", deleteError)
      throw new Error("Failed to delete file")
    }

    // Delete attachment record
    await prisma.attachment.delete({
      where: { id: attachment.id },
    })
  }

  static async getAttachments(entityType: string, entityId: string): Promise<Attachment[]> {
    const attachments = await prisma.attachment.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return attachments.map(att => ({
      name: att.name,
      url: att.url,
      type: att.type,
      size: att.size,
      uploadDate: att.createdAt,
    }))
  }
} 