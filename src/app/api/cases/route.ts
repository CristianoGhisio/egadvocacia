import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { requireSession } from '@/lib/api-auth'
import { jsonError } from '@/lib/api-errors'

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
        const { session, errorResponse } = await requireSession()
        if (!session) return errorResponse

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const clientId = searchParams.get('clientId')
        const lawyerId = searchParams.get('lawyerId')

        const where: Prisma.MatterWhereInput = {
            tenantId: session.user.tenantId,
        }

        const pageParam = searchParams.get('page')
        const pageSizeParam = searchParams.get('pageSize')

        const isPaginated = !!(pageParam || pageSizeParam)

        const page = pageParam ? Math.max(1, Number(pageParam)) : 1
        const pageSizeRaw = pageSizeParam ? Number(pageSizeParam) : 20
        const pageSize = Math.min(Math.max(1, pageSizeRaw), 100)

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

        if (!isPaginated) {
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
                },
            })

            return NextResponse.json(cases)
        }

        const [cases, total] = await Promise.all([
            prisma.matter.findMany({
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
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.matter.count({ where }),
        ])

        return NextResponse.json({
            data: cases,
            pagination: {
                page,
                pageSize,
                total,
                pageCount: Math.ceil(total / pageSize),
            },
        })
    } catch (error) {
        console.error('Error fetching cases:', error)
        return jsonError(500, { error: 'Erro ao buscar processos' })
    }
}

// POST /api/cases - Create new case
export async function POST(request: NextRequest) {
    try {
        const { session, errorResponse } = await requireSession()
        if (!session) return errorResponse

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
            return jsonError(400, { error: 'Dados inválidos', details: error.issues })
        }

        console.error('Error creating case:', error)
        return jsonError(500, {
            error: 'Erro ao criar processo',
            details: error instanceof Error ? error.message : 'Unknown error',
        })
    }
}
