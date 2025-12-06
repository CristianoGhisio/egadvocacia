import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateClientSchema = z.object({
    type: z.enum(['pf', 'pj']).optional(),
    name: z.string().min(3).optional(),
    cpfCnpj: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),

    // Address fields
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),

    responsibleLawyerId: z.string().optional(),
    status: z.enum(['lead', 'active', 'inactive', 'archived']).optional(),
    leadStage: z.enum(['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
    tags: z.array(z.string()).optional(),
})

// GET /api/crm/clients/[id] - Get client details
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

        // Unwrap params Promise (Next.js 16)
        const { id } = await params

        const client = await prisma.client.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            },
            include: {
                responsibleLawyer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                },
                contacts: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                interactions: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 10,
                    include: {
                        user: {
                            select: {
                                fullName: true,
                            }
                        }
                    }
                },
                matters: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        responsibleLawyer: {
                            select: {
                                fullName: true,
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        matters: true,
                        contacts: true,
                        interactions: true,
                    }
                }
            }
        })

        if (!client) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(client)
    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar cliente' },
            { status: 500 }
        )
    }
}

// PATCH /api/crm/clients/[id] - Update client
export async function PATCH(
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
        const validatedData = updateClientSchema.parse(body)

        // Check if client exists and belongs to tenant
        const existingClient = await prisma.client.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        if (!existingClient) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        // Check if CPF/CNPJ is being changed and if it already exists
        if (validatedData.cpfCnpj && validatedData.cpfCnpj !== existingClient.cpfCnpj) {
            const duplicate = await prisma.client.findFirst({
                where: {
                    cpfCnpj: validatedData.cpfCnpj,
                    tenantId: session.user.tenantId,
                    id: { not: id }
                }
            })

            if (duplicate) {
                return NextResponse.json(
                    { error: 'Cliente com este CPF/CNPJ já existe' },
                    { status: 400 }
                )
            }
        }

        // Build tags JSON
        const tagsJson = validatedData.tags ? JSON.stringify(validatedData.tags) : undefined

        const updatedClient = await prisma.client.update({
            where: { id },
            data: {
                ...(validatedData.type && { type: validatedData.type }),
                ...(validatedData.name && { name: validatedData.name }),
                ...(validatedData.cpfCnpj !== undefined && { cpfCnpj: validatedData.cpfCnpj || null }),
                ...(validatedData.email !== undefined && { email: validatedData.email || null }),
                ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),

                // New address fields
                ...(validatedData.street !== undefined && { street: validatedData.street || null }),
                ...(validatedData.number !== undefined && { number: validatedData.number || null }),
                ...(validatedData.complement !== undefined && { complement: validatedData.complement || null }),
                ...(validatedData.neighborhood !== undefined && { neighborhood: validatedData.neighborhood || null }),
                ...(validatedData.city !== undefined && { city: validatedData.city || null }),
                ...(validatedData.state !== undefined && { state: validatedData.state || null }),
                ...(validatedData.zipCode !== undefined && { zipCode: validatedData.zipCode || null }),

                ...(validatedData.responsibleLawyerId !== undefined && { responsibleLawyerId: validatedData.responsibleLawyerId || null }),
                ...(validatedData.status && { status: validatedData.status }),
                ...(validatedData.leadStage && { leadStage: validatedData.leadStage }),
                ...(tagsJson && { tags: tagsJson }),
                updatedAt: new Date(),
            },
            include: {
                responsibleLawyer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                }
            }
        })

        return NextResponse.json(updatedClient)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Error updating client:', error)
        return NextResponse.json(
            { error: 'Erro ao atualizar cliente' },
            { status: 500 }
        )
    }
}

// DELETE /api/crm/clients/[id] - Archive client
export async function DELETE(
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

        // Check if client exists and belongs to tenant
        const existingClient = await prisma.client.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        if (!existingClient) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        // Soft delete - just archive instead of deleting
        const archivedClient = await prisma.client.update({
            where: { id },
            data: {
                status: 'archived',
                updatedAt: new Date(),
            }
        })

        return NextResponse.json({
            message: 'Cliente arquivado com sucesso',
            client: archivedClient
        })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json(
            { error: 'Erro ao arquivar cliente' },
            { status: 500 }
        )
    }
}
