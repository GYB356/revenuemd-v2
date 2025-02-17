import { createClient } from '@supabase/supabase-js';
import { prisma } from '../../lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  entityType: string;
  entityId: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttachmentUploadParams {
  file: File;
  entityType: string;
  entityId: string;
  uploadedBy: string;
}

export interface AttachmentDeleteParams {
  id: string;
  uploadedBy: string;
}

export class AttachmentService {
  private static BUCKET_NAME = 'attachments';

  static async upload({ file, entityType, entityId, uploadedBy }: AttachmentUploadParams): Promise<Attachment> {
    const fileName = `${entityType}/${entityId}/${Date.now()}-${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    const { data: urlData } = await supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    const attachment = await prisma.attachment.create({
      data: {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        entityType,
        entityId,
        uploadedBy,
      },
    });

    return attachment;
  }

  static async delete({ id, uploadedBy }: AttachmentDeleteParams): Promise<void> {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    if (attachment.uploadedBy !== uploadedBy) {
      throw new Error('Unauthorized to delete this attachment');
    }

    const fileName = attachment.url.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid attachment URL');
    }

    const { error: deleteError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([`${attachment.entityType}/${attachment.entityId}/${fileName}`]);

    if (deleteError) {
      throw new Error(`Failed to delete file: ${deleteError.message}`);
    }

    await prisma.attachment.delete({
      where: { id },
    });
  }

  static async getAttachments(entityType: string, entityId: string): Promise<Attachment[]> {
    const attachments = await prisma.attachment.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return attachments;
  }
} 