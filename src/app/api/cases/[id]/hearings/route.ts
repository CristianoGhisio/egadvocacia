import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const hearingSchema = z.object({
    hearingDate: z.string().datetime(),
    type: z.string().optional(),
    location: z.string().optional(),
    attendees: z.array(z.string()).optional(), // Simple array of names for now
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
})

// GET /api/cases/[id]/hearings
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: matterId } = await params

        const hearings = await prisma.hearing.findMany({
            where: {
                matterId,
                tenantId: session.user.tenantId,
            },
            orderBy: {
                hearingDate: 'asc',
            },
        })

        return NextResponse.json(hearings)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar audiências' }, { status: 500 })
    }
}

// POST /api/cases/[id]/hearings
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id: matterId } = await params
        const body = await request.json()
        const validatedData = hearingSchema.parse(body)

        const attendeesJson = validatedData.attendees ? JSON.stringify(validatedData.attendees) : null

        const hearing = await prisma.hearing.create({
            data: {
                hearingDate: validatedData.hearingDate,
                type: validatedData.type || null,
                location: validatedData.location || null,
                notes: validatedData.notes || null,
                attendees: attendeesJson,
                status: validatedData.status,

                matterId,
                tenantId: session.user.tenantId,
            },
        })

        return NextResponse.json(hearing, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Erro ao agendar audiência' }, { status: 500 })
    }
}
