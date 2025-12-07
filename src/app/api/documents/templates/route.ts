import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { can, canAsync } from '@/lib/rbac'

const createTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'documents.templates.view') || await canAsync(session.user, tenantId, 'documents.templates.view')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const templates = await prisma.template.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'documents.templates.manage') || await canAsync(session.user, tenantId, 'documents.templates.manage')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const data = createTemplateSchema.parse(body)

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        category: data.category,
        content: data.content,
        variables: JSON.stringify(data.variables || []),
        createdById: session.user.id,
      }
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: session.user.id,
        action: 'create',
        entityType: 'template',
        entityId: template.id,
        oldData: null,
        newData: JSON.stringify({ name: data.name, category: data.category }),
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 })
  }
}
