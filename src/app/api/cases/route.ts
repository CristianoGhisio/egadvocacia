import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema
const caseSchema = z.object({
    clientId: z.string().uuid('Cliente inválido'),
    processNumber: z.string().optional(),
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: z.string().optional(),
    court: z.string().optional(),
    district: z.string().optional(),
    department: z.string().optional(),
    instance: z.string().optional(),
    practiceArea: z.string().min(1, 'Área de prática é obrigatória'),
    responsibleLawyerId: z.string().uuid('Advogado inválido').optional(),
    status: z.enum(['open', 'pending', 'closed', 'archived']).default('open'),
    riskScore: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
})

// GET /api/cases - List all cases
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
        const search = searchParams.get('search')
        const clientId = searchParams.get('clientId')
        const lawyerId = searchParams.get('lawyerId')

        const where: any = {
            tenantId: session.user.tenantId,
        }

        if (status) {
            where.status = status
        }

        if (clientId) {
            where.clientId = clientId
        }

        if (lawyerId) {
            where.responsibleLawyerId = lawyerId
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { processNumber: { contains: search } },
                { description: { contains: search } },
                // Search in Client name
                { client: { name: { contains: search } } }
            ]
        }

        const cases = await prisma.matter.findMany({
            where,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                responsibleLawyer: {
                    select: {
                        id: true,
                        fullName: true,
                    }
                },
                _count: {
                    select: {
                        tasks: true,
                        deadlines: true,
                        hearings: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(cases)
    } catch (error) {
        console.error('Error fetching cases:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar processos' },
            { status: 500 }
        )
    }
}

// POST /api/cases - Create new case
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
        const validatedData = caseSchema.parse(body)

        // Build tags JSON
        const tagsJson = validatedData.tags ? JSON.stringify(validatedData.tags) : null

        const matter = await prisma.matter.create({
            data: {
                title: validatedData.title,
                processNumber: validatedData.processNumber || null,
                description: validatedData.description || null,
                court: validatedData.court || null,
                district: validatedData.district || null,
                department: validatedData.department || null,
                instance: validatedData.instance || null,
                practiceArea: validatedData.practiceArea,
                status: validatedData.status,
                riskScore: validatedData.riskScore || null,
                tags: tagsJson,

                tenantId: session.user.tenantId,
                clientId: validatedData.clientId,
                responsibleLawyerId: validatedData.responsibleLawyerId || null,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                responsibleLawyer: {
                    select: {
                        id: true,
                        fullName: true,
                    }
                }
            }
        })

        return NextResponse.json(matter, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Error creating case:', error)
        return NextResponse.json(
            { error: 'Erro ao criar processo', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
