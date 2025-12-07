import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { v4 as uuidv4 } from 'uuid'
import { can, canAsync } from '@/lib/rbac'
import type { Prisma } from '@prisma/client'

// GET /api/documents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'documents.view') || await canAsync(session.user, tenantId, 'documents.view')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { searchParams } = new URL(request.url)
        const matterId = searchParams.get('matterId')
        const clientId = searchParams.get('clientId')

        const where: Prisma.DocumentWhereInput = {
            tenantId,
        }

        if (matterId) where.matterId = matterId
        if (clientId) where.clientId = clientId

        // Filter: If excludeMatters is true, only fetch documents WITHOUT a matter (Personal docs)
        const excludeMatters = searchParams.get('excludeMatters') === 'true'
        if (excludeMatters) {
            where.matterId = null
        }

        const documents = await prisma.document.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                uploadedBy: {
                    select: { fullName: true }
                },
                matter: {
                    select: { id: true, title: true }
                },
                client: {
                    select: { id: true, name: true }
                }
            }
        })

        return NextResponse.json(documents)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao listar documentos' }, { status: 500 })
    }
}

// POST /api/documents
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'documents.manage') || await canAsync(session.user, tenantId, 'documents.manage')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const matterId = formData.get('matterId') as string | null
        const clientId = formData.get('clientId') as string | null
        // const type = formData.get('type') as string || 'Outros' // If we want to categorize

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create directory structure: public/uploads/YYYY/MM
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const relativeDir = `/uploads/${year}/${month}`
        const absoluteDir = join(process.cwd(), 'public', relativeDir)

        await mkdir(absoluteDir, { recursive: true })

        // Unique filename
        const uniqueSuffix = uuidv4()
        const extension = file.name.split('.').pop()
        const filename = `${uniqueSuffix}.${extension}`
        const filePath = join(absoluteDir, filename)
        const publicUrl = `${relativeDir}/${filename}`

        await writeFile(filePath, buffer)

        // Create DB Record
        const document = await prisma.document.create({
            data: {
                name: file.name,
                mimeType: file.type,
                fileSize: file.size,
                storagePath: publicUrl, // Storing the public URL for easy access
                type: 'Outros', // Default type
                tenantId,
                matterId: matterId || null,
                clientId: clientId || null,
                uploadedById: session.user.id
            }
        })

        // Create initial version entry
        await prisma.documentVersion.create({
            data: {
                tenantId,
                documentId: document.id,
                version: 1,
                storagePath: publicUrl,
                fileSize: file.size,
                uploadedById: session.user.id,
                changesDescription: 'Versão inicial (upload)'
            }
        })

        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: session.user.id,
                action: 'create',
                entityType: 'document',
                entityId: document.id,
                oldData: null,
                newData: JSON.stringify({ name: file.name, path: publicUrl, matterId, clientId }),
            }
        })

        return NextResponse.json(document, { status: 201 })
    } catch (error) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: 'Erro ao processar upload' }, { status: 500 })
    }
}
