import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const interactionSchema = z.object({
    type: z.enum(['call', 'email', 'meeting', 'note']),
    subject: z.string().min(3, 'Assunto deve ter no mínimo 3 caracteres'),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
})

// GET /api/crm/clients/[id]/interactions - List client interactions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { id } = await params

        // Verify client belongs to tenant
        const client = await prisma.client.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        if (!client) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        const interactions = await prisma.interaction.findMany({
            where: {
                clientId: id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(interactions)
    } catch (error) {
        console.error('Error fetching interactions:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar interações' },
            { status: 500 }
        )
    }
}

// POST /api/crm/clients/[id]/interactions - Create interaction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await request.json()

        // Validate input
        const validatedData = interactionSchema.parse(body)

        // Verify client belongs to tenant
        const client = await prisma.client.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        if (!client) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        const interaction = await prisma.interaction.create({
            data: {
                type: validatedData.type,
                subject: validatedData.subject,
                description: validatedData.description,
                metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : undefined,
                clientId: id,
                userId: session.user.id,
                tenantId: session.user.tenantId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                }
            }
        })

        return NextResponse.json(interaction, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: (error as z.ZodError).issues },
                { status: 400 }
            )
        }

        console.error('Error creating interaction:', error)
        return NextResponse.json(
            { error: 'Erro ao criar interação' },
            { status: 500 }
        )
    }
}
