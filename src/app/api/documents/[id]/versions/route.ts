import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'
import { can, canAsync } from '@/lib/rbac'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'documents.view') || await canAsync(session.user, tenantId, 'documents.view')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const doc = await prisma.document.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true }
    })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: id, tenantId: session.user.tenantId },
      orderBy: { version: 'desc' }
    })

    return NextResponse.json(versions)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar versões' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'documents.manage') || await canAsync(session.user, tenantId, 'documents.manage')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const existing = await prisma.document.findFirst({
      where: { id, tenantId }
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const form = await request.formData()
    const file = form.get('file') as File | null
    const changesDescription = (form.get('changesDescription') as string) || undefined
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const relativeDir = `/uploads/${year}/${month}`
    const absoluteDir = join(process.cwd(), 'public', relativeDir)
    await mkdir(absoluteDir, { recursive: true })

    const extension = file.name.split('.').pop()
    const filename = `${crypto.randomUUID()}.${extension}`
    const filePath = join(absoluteDir, filename)
    const publicUrl = `${relativeDir}/${filename}`
    await writeFile(filePath, buffer)

    const newVersionNumber = (existing.version || 1) + 1

    const createdVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.documentVersion.create({
        data: {
          tenantId,
          documentId: id,
          version: newVersionNumber,
          storagePath: publicUrl,
          fileSize: file.size,
          uploadedById: session.user.id,
          changesDescription,
        }
      })

      await tx.document.update({
        where: { id },
        data: {
          version: newVersionNumber,
          storagePath: publicUrl,
          fileSize: file.size,
          mimeType: file.type || existing.mimeType || undefined,
        }
      })

      return version
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'update',
        entityType: 'document',
        entityId: id,
        oldData: JSON.stringify({ version: existing.version, storagePath: existing.storagePath }),
        newData: JSON.stringify({ version: newVersionNumber, storagePath: publicUrl }),
      }
    })

    return NextResponse.json(createdVersion, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar nova versão' }, { status: 500 })
  }
}
