/// <reference types="multer" />
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { extname } from 'node:path'
import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from './storage.service'

const TENANT_ID = 1n

/** 10 MB. Passport scans and transcripts sit far below this. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024

/**
 * Extension allow-list. Deliberately a list of what is permitted rather than a
 * list of what is blocked: a deny-list silently admits every format nobody
 * thought of, which for a file store is the wrong direction to fail.
 */
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.doc',
  '.docx',
])

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "18 Jan 2026 12:39 PM" — the format the portal's document table renders. */
function fmtDateTime(d: Date): string {
  const h24 = d.getHours()
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mins = String(d.getMinutes()).padStart(2, '0')
  const period = h24 < 12 ? 'AM' : 'PM'
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${h12}:${mins} ${period}`
}

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private get db() {
    return this.prisma.client
  }

  /** Documents attached to one application, newest first. */
  async list(applicationId: number) {
    await this.requireApplication(applicationId)
    const rows = await this.db.applicationDocument.findMany({
      where: { tenantId: TENANT_ID, applicationId: BigInt(applicationId), deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
    })
    return rows.map((r) => this.toDto(r))
  }

  /**
   * Store an uploaded file and record it against the application.
   *
   * Validation happens here rather than in a Multer filter so the rules live
   * next to the storage call and apply however the file arrives.
   */
  async upload(applicationId: number, file: Express.Multer.File, type?: string) {
    await this.requireApplication(applicationId)

    if (!file?.buffer?.length) throw new BadRequestException('No file was uploaded.')
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(`File is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`)
    }

    const ext = extname(file.originalname).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(
        `Files of type "${ext || 'unknown'}" are not accepted. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}.`,
      )
    }

    const key = await this.storage.put(file.buffer, file.originalname)

    const created = await this.db.applicationDocument.create({
      data: {
        tenantId: TENANT_ID,
        applicationId: BigInt(applicationId),
        // The display name is the client's, kept only as text. The stored key
        // is generated, so this value never touches the filesystem.
        name: file.originalname,
        type: type?.trim() || 'Other',
        fileUrl: key,
        fileSize: file.size,
        status: 'Uploaded',
      },
    })
    return this.toDto(created)
  }

  /**
   * Resolve a document to a readable stream plus the metadata needed to send
   * it. Returns the display name so the browser can offer a sensible filename
   * even though the stored key is a UUID.
   */
  async download(applicationId: number, documentId: number) {
    const doc = await this.db.applicationDocument.findFirst({
      where: {
        id: BigInt(documentId),
        applicationId: BigInt(applicationId),
        tenantId: TENANT_ID,
        deletedAt: null,
      },
    })
    if (!doc?.fileUrl) throw new NotFoundException(`Document ${documentId} not found.`)

    const stream = this.storage.read(doc.fileUrl)
    // The row can outlive the bytes (manual cleanup, a restored DB backup), and
    // that is a 404 for the file rather than a 500.
    if (!stream) throw new NotFoundException('The stored file is no longer available.')

    return { stream, name: doc.name, size: doc.fileSize ?? undefined }
  }

  /**
   * Soft-delete the record and remove the bytes.
   *
   * The row stays so the document still appears in history; the file itself
   * goes, because keeping unreferenced passport scans on disk is exactly the
   * liability this deletes.
   */
  async remove(applicationId: number, documentId: number) {
    const doc = await this.db.applicationDocument.findFirst({
      where: {
        id: BigInt(documentId),
        applicationId: BigInt(applicationId),
        tenantId: TENANT_ID,
        deletedAt: null,
      },
    })
    if (!doc) throw new NotFoundException(`Document ${documentId} not found.`)

    await this.db.applicationDocument.update({
      where: { id: doc.id },
      data: { deletedAt: new Date() },
    })
    if (doc.fileUrl) await this.storage.remove(doc.fileUrl)

    return { ok: true }
  }

  private async requireApplication(applicationId: number) {
    const app = await this.db.application.findFirst({
      where: { id: BigInt(applicationId), tenantId: TENANT_ID, deletedAt: null },
      select: { id: true },
    })
    if (!app) throw new NotFoundException(`Application ${applicationId} not found.`)
    return app
  }

  /**
   * Flat shape for the UI. `fileUrl` is deliberately not exposed — it is a
   * storage key, and handing it to the browser would invite direct access that
   * bypasses the authenticated download route.
   */
  private toDto(d: {
    id: bigint
    publicId: string
    name: string
    type: string
    fileSize: number | null
    status: string
    uploadedAt: Date
    applicationId: bigint
  }) {
    return {
      id: Number(d.id),
      publicId: d.publicId,
      applicationId: Number(d.applicationId),
      name: d.name,
      type: d.type,
      size: d.fileSize ?? 0,
      status: d.status,
      uploadedAt: fmtDateTime(d.uploadedAt),
      /** Where the browser fetches the bytes (authenticated). */
      downloadPath: `/applications/${Number(d.applicationId)}/documents/${Number(d.id)}`,
    }
  }
}
