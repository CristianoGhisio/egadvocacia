import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'
import { can, canAsync } from '@/lib/rbac'

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc: unknown, key: string) => {
    if (acc && typeof acc === 'object' && acc !== null) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function renderContent(
  content: string,
  ctx: Record<string, unknown>,
  overrides?: Record<string, string | number | boolean | null | undefined>
) {
  return content.replace(/\{\{\s*([\w\.\-]+)\s*\}\}/g, (_m, key: string) => {
    if (overrides && overrides[key] !== undefined && overrides[key] !== null) {
      return String(overrides[key])
    }
    if (key === 'today') {
      const d = new Date()
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }
    const value = resolvePath(ctx, key)
    return value !== undefined && value !== null ? String(value) : ''
  })
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

    const { id: templateId } = await params
    const body = await request.json()
    const { matterId, clientId, variables } = body as {
      matterId?: string
      clientId?: string
      variables?: Record<string, string | number | boolean>
    }

    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'documents.templates.manage') || await canAsync(session.user, tenantId, 'documents.templates.manage')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const template = await prisma.template.findFirst({
      where: { id: templateId, tenantId },
    })
    if (!template) return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })

    type MinimalMatter = { id: string; title?: string; client?: { id: string; name?: string } | null }
    type MinimalClient = { id: string; name?: string }
    let matter: MinimalMatter | null = null
    let client: MinimalClient | null = null
    if (matterId) {
      matter = await prisma.matter.findFirst({
        where: { id: matterId, tenantId },
        include: { client: true }
      })
      client = matter?.client || null
    } else if (clientId) {
      client = (await prisma.client.findFirst({ where: { id: clientId, tenantId } })) as MinimalClient | null
    }

    const userInfo: { name?: string | null; fullName?: string | null; email?: string | null } = {
      name: session.user.name,
      email: session.user.email,
    }
    const ctx = { matter, client, user: { name: userInfo.fullName || userInfo.name || '', email: userInfo.email || '' } }
    const rendered = renderContent(template.content, ctx, variables || {})

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const relativeDir = `/uploads/${year}/${month}`
    const absoluteDir = join(process.cwd(), 'public', relativeDir)
    await mkdir(absoluteDir, { recursive: true })

    const safeName = template.name.replace(/[^a-zA-Z0-9\-_. ]/g, '')
    const filename = `${crypto.randomUUID()}.txt`
    const filePath = join(absoluteDir, filename)
    const publicUrl = `${relativeDir}/${filename}`
    await writeFile(filePath, rendered, 'utf8')

    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          tenantId,
          matterId: matter?.id || null,
          clientId: client?.id || null,
          name: `${safeName} - ${client?.name || matter?.title || 'Documento'} - ${year}${String(month).padStart(2, '0')}`,
          description: template.description || undefined,
          type: 'Template',
          storagePath: publicUrl,
          fileSize: rendered.length,
          mimeType: 'text/plain',
          version: 1,
          isTemplate: false,
          uploadedById: session.user.id,
        }
      })

      await tx.documentVersion.create({
        data: {
          tenantId,
          documentId: created.id,
          version: 1,
          storagePath: publicUrl,
          fileSize: rendered.length,
          uploadedById: session.user.id,
          changesDescription: 'Versão inicial gerada por template',
        }
      })

    
      return created
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'create',
        entityType: 'document',
        entityId: doc.id,
        oldData: null,
        newData: JSON.stringify({ templateId, matterId: matter?.id || null, clientId: client?.id || null }),
      }
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao gerar documento' }, { status: 500 })
  }
}
