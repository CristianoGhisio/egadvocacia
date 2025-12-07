import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

// Validation schema
const clientSchema = z.object({
    type: z.enum(['pf', 'pj']),
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    cpfCnpj: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
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
    status: z.enum(['lead', 'active', 'inactive', 'archived']).default('active'),
    leadStage: z.enum(['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
    tags: z.array(z.string()).optional(),
})

// GET /api/crm/clients - List all clients
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const leadStage = searchParams.get('leadStage')
        const search = searchParams.get('search')
        const type = searchParams.get('type')

        const where: Prisma.ClientWhereInput = {
            tenantId: session.user.tenantId,
        }

        if (status) {
            where.status = status
        }

        if (leadStage) {
            where.leadStage = leadStage
        }

        if (type) {
            where.type = type
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { cpfCnpj: { contains: search } },
            ]
        }

        const clients = await prisma.client.findMany({
            where,
            include: {
                responsibleLawyer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                },
                _count: {
                    select: {
                        matters: true,
                        contacts: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(clients)
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar clientes' },
            { status: 500 }
        )
    }
}

// POST /api/crm/clients - Create new client
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const validatedData = clientSchema.parse(body)

        // Check if CPF/CNPJ already exists
        if (validatedData.cpfCnpj) {
            const existing = await prisma.client.findFirst({
                where: {
                    cpfCnpj: validatedData.cpfCnpj,
                    tenantId: session.user.tenantId,
                }
            })

            if (existing) {
                const statusMap: Record<string, string> = {
                    'active': 'Ativo',
                    'inactive': 'Inativo',
                    'archived': 'Arquivado',
                    'lead': 'Lead'
                }
                const statusPT = statusMap[existing.status] || existing.status
                return NextResponse.json(
                    { error: `Cliente já cadastrado com este CPF/CNPJ (Status: ${statusPT})` },
                    { status: 400 }
                )
            }
        }

        // Build tags JSON
        const tagsJson = validatedData.tags ? JSON.stringify(validatedData.tags) : null

        const client = await prisma.client.create({
            data: {
                type: validatedData.type,
                name: validatedData.name,
                cpfCnpj: validatedData.cpfCnpj || null,
                email: validatedData.email || null,
                phone: validatedData.phone || null,

                // New address fields
                street: validatedData.street || null,
                number: validatedData.number || null,
                complement: validatedData.complement || null,
                neighborhood: validatedData.neighborhood || null,
                city: validatedData.city || null,
                state: validatedData.state || null,
                zipCode: validatedData.zipCode || null,

                responsibleLawyerId: validatedData.responsibleLawyerId || null,
                status: validatedData.status,
                leadStage: validatedData.leadStage || 'new',
                tags: tagsJson,
                tenantId: session.user.tenantId,
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

        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Error creating client:', error)
        return NextResponse.json(
            { error: 'Erro ao criar cliente', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
