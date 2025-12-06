import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const deadlineSchema = z.object({
    title: z.string().min(3, 'Título obrigatório'),
    description: z.string().optional(),
    deadlineDate: z.string().datetime(), // ISO Date string
    alertDaysBefore: z.number().min(0).default(3),
})

// GET /api/cases/[id]/deadlines - List deadlines
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: matterId } = await params

        const deadlines = await prisma.deadline.findMany({
            where: {
                matterId,
                tenantId: session.user.tenantId,
            },
            orderBy: {
                deadlineDate: 'asc',
            },
        })

        return NextResponse.json(deadlines)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar prazos' }, { status: 500 })
    }
}

// POST /api/cases/[id]/deadlines - Create deadline
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: matterId } = await params
        const body = await request.json()
        const validatedData = deadlineSchema.parse(body)

        const deadline = await prisma.deadline.create({
            data: {
                ...validatedData,
                matterId,
                tenantId: session.user.tenantId,
            },
        })

        return NextResponse.json(deadline, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Erro ao criar prazo' }, { status: 500 })
    }
}

// PATCH /api/cases/[id]/deadlines - Mark as completed (generically via query param or body ID? The route is nested under ID, but usually we need deadline ID.
// Ideally should be /api/deadlines/[deadlineId] but for simplicity I'll handle "toggle" here if needed?
// No, standard REST implies /api/cases/[id]/deadlines creates a new resource.
// I will create a separate route for UPDATE/TOGGLE or just assume simplistic usage for now.
// Wait, the plan said "PATCH: Mark deadline as completed".
// Standard REST for sub-resource: /api/cases/[id]/deadlines/[deadlineId] OR just use /api/deadlines/[deadlineId].
// Given I didn't plan for a dedicated generic route, I will make a generic "/api/deadlines" route OR handle it here if I pass deadline ID in body (unconventional but works).
// BETTER: I'll stick to the plan but realize I might need a specific route for the deadline update.
// Actually, for simplicity/speed in this context, I'll create a dedicated generic route for completing deadlines as it's cleaner.
// /api/crm/deadlines/[id]/toggle ?
// Let's stick to creating the LIST/CREATE here. I will handle updates in a separate generic route or standard route.
