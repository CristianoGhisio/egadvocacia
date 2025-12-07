import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedToId: z.string().uuid().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const matter = await prisma.matter.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true }
    })
    if (!matter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const tasks = await prisma.task.findMany({
      where: { tenantId: session.user.tenantId, matterId: id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao listar tarefas' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const data = createTaskSchema.parse(body)

    const matter = await prisma.matter.findFirst({
      where: { id, tenantId: session.user.tenantId },
      select: { id: true }
    })
    if (!matter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const task = await prisma.task.create({
      data: {
        tenantId: session.user.tenantId,
        matterId: id,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        priority: data.priority,
        status: 'pending',
        assignedToId: data.assignedToId,
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}

