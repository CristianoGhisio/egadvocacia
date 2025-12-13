import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { can, canAsync } from '@/lib/rbac'
import { requireSession } from '@/lib/api-auth'
import { jsonError } from '@/lib/api-errors'

const updateCaseSchema = z.object({
    clientId: z.string().uuid().optional(),
    processNumber: z.string().optional(),
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    court: z.string().optional(),
    district: z.string().optional(),
    department: z.string().optional(),
    instance: z.string().optional(),
    practiceArea: z.string().optional(),
    responsibleLawyerId: z.string().uuid().optional(),
    status: z.enum(['open', 'pending', 'closed', 'archived']).optional(),
    riskScore: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
})

// GET /api/cases/[id] - Get case details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, errorResponse } = await requireSession()
        if (!session) return errorResponse

        const tenantId = session.user.tenantId
        const allowed = can(session.user, 'cases.view') || await canAsync(session.user, tenantId, 'cases.view')
        if (!allowed) return jsonError(403, { error: 'Forbidden', code: 'forbidden' })

        // Unwrap params Promise (Next.js 16)
        const { id } = await params

        const matter = await prisma.matter.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        type: true,
                    }
                },
                responsibleLawyer: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                },
                deadlines: {
                    where: { isCompleted: false },
                    orderBy: { deadlineDate: 'asc' },
                    take: 5,
                },
                tasks: {
                    where: { status: { not: 'completed' } },
                    orderBy: { dueDate: 'asc' },
                    take: 5,
                },
                _count: {
                    select: {
                        documents: true,
                        activities: true,
                        hearings: true,
                    }
                }
            }
        })

        if (!matter) {
            return jsonError(404, { error: 'Processo não encontrado' })
        }

        return NextResponse.json(matter)
    } catch (error) {
        console.error('Error fetching case:', error)
        return jsonError(500, { error: 'Erro ao buscar processo' })
    }
}

// PATCH /api/cases/[id] - Update case
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, errorResponse } = await requireSession()
        if (!session) return errorResponse

        const tenantId = session.user.tenantId
        const allowed = can(session.user, 'cases.manage') || await canAsync(session.user, tenantId, 'cases.manage')
        if (!allowed) return jsonError(403, { error: 'Forbidden', code: 'forbidden' })

        const { id } = await params
        const body = await request.json()
        const validatedData = updateCaseSchema.parse(body)

        // Check ownership
        const existingMatter = await prisma.matter.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        if (!existingMatter) {
            return jsonError(404, { error: 'Processo não encontrado' })
        }

        // Build tags JSON
        const tagsJson = validatedData.tags ? JSON.stringify(validatedData.tags) : undefined

        const updatedMatter = await prisma.matter.update({
            where: { id },
            data: {
                ...(validatedData.title && { title: validatedData.title }),
                ...(validatedData.processNumber !== undefined && { processNumber: validatedData.processNumber || null }),
                ...(validatedData.description !== undefined && { description: validatedData.description || null }),
                ...(validatedData.court !== undefined && { court: validatedData.court || null }),
                ...(validatedData.district !== undefined && { district: validatedData.district || null }),
                ...(validatedData.department !== undefined && { department: validatedData.department || null }),
                ...(validatedData.instance !== undefined && { instance: validatedData.instance || null }),
                ...(validatedData.practiceArea && { practiceArea: validatedData.practiceArea }),

                ...(validatedData.clientId && { clientId: validatedData.clientId }),
                ...(validatedData.responsibleLawyerId !== undefined && { responsibleLawyerId: validatedData.responsibleLawyerId || null }),

                ...(validatedData.status && { status: validatedData.status }),
                ...(validatedData.riskScore !== undefined && { riskScore: validatedData.riskScore }),

                ...(tagsJson && { tags: tagsJson }),
                updatedAt: new Date(),
            },
            include: {
                client: { select: { id: true, name: true } },
                responsibleLawyer: { select: { id: true, fullName: true } }
            }
        })

        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: session.user.id,
                action: 'update',
                entityType: 'matter',
                entityId: id,
                oldData: null,
                newData: JSON.stringify(validatedData),
            }
        })

        return NextResponse.json(updatedMatter)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return jsonError(400, { error: 'Dados inválidos', details: error.issues })
        }

        console.error('Error updating case:', error)
        return jsonError(500, { error: 'Erro ao atualizar processo' })
    }
}

// DELETE /api/cases/[id] - Archive/Delete case
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, errorResponse } = await requireSession()
        if (!session) return errorResponse

        const tenantId = session.user.tenantId
        const allowed = can(session.user, 'cases.manage') || await canAsync(session.user, tenantId, 'cases.manage')
        if (!allowed) return jsonError(403, { error: 'Forbidden', code: 'forbidden' })

        const { id } = await params

        // Check ownership
        const existingMatter = await prisma.matter.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        if (!existingMatter) {
            return jsonError(404, { error: 'Processo não encontrado' })
        }

        // Validar se pode deletar (ex: tem faturas pagas?)
        // Por segurança, apenas arquivamos por enquanto
        const archivedMatter = await prisma.matter.update({
            where: { id },
            data: {
                status: 'archived',
                updatedAt: new Date(),
            }
        })
        await prisma.auditLog.create({
            data: {
                tenantId,
                userId: session.user.id,
                action: 'archive',
                entityType: 'matter',
                entityId: id,
                oldData: null,
                newData: JSON.stringify({ status: 'archived' }),
            }
        })

        return NextResponse.json({
            message: 'Processo arquivado com sucesso',
            matter: archivedMatter
        })
    } catch (error) {
        console.error('Error deleting case:', error)
        return jsonError(500, { error: 'Erro ao arquivar processo' })
    }
}
