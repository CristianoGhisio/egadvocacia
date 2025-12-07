import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const activitySchema = z.object({
  action: z.string().min(2),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

// GET /api/cases/[id]/activities - Lista timeline de atividades do processo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id: matterId } = await params

    const matter = await prisma.matter.findFirst({
      where: { id: matterId, tenantId: session.user.tenantId },
      select: { id: true }
    })
    if (!matter) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

    const activities = await prisma.activity.findMany({
      where: { tenantId: session.user.tenantId, matterId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true } }
      }
    })

    // Parse metadata JSON
    const result = activities.map(a => ({
      ...a,
      metadata: (() => { try { return JSON.parse(a.metadata || '{}') } catch { return {} } })()
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar atividades' }, { status: 500 })
  }
}

// POST /api/cases/[id]/activities - Registra uma atividade manualmente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id: matterId } = await params
    const json = await request.json()
    const data = activitySchema.parse(json)

    const matter = await prisma.matter.findFirst({
      where: { id: matterId, tenantId: session.user.tenantId },
      select: { id: true, title: true }
    })
    if (!matter) return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })

    const created = await prisma.activity.create({
      data: {
        tenantId: session.user.tenantId,
        matterId,
        userId: session.user.id,
        action: data.action,
        description: data.description,
        metadata: JSON.stringify(data.metadata || {}),
      }
    })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'create',
        entityType: 'activity',
        entityId: created.id,
        oldData: null,
        newData: JSON.stringify({ action: created.action, matterId, description: created.description }),
      }
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao registrar atividade' }, { status: 500 })
  }
}
