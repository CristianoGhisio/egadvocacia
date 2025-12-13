import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/api-auth'
import { jsonError } from '@/lib/api-errors'

export async function GET(request: Request) {
    try {
        const { session, errorResponse } = await requireSession()
        if (!session) return errorResponse

        if (!session.user.id || !session.user.tenantId) {
            return jsonError(401, { error: 'Usuário inválido', code: 'invalid_session' })
        }

        const { searchParams } = new URL(request.url)
        const startStr = searchParams.get('start')
        const endStr = searchParams.get('end')

        if (!startStr || !endStr) {
            return jsonError(400, { error: 'Parâmetros de data obrigatórios', code: 'missing_date_range' })
        }

        const startDate = new Date(startStr)
        const endDate = new Date(endStr)

        const tenantId = session.user.tenantId

        // Fetch Deadlines
        const deadlines = await prisma.deadline.findMany({
            where: {
                tenantId,
                deadlineDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                matter: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            }
        })

        // Fetch Hearings
        const hearings = await prisma.hearing.findMany({
            where: {
                tenantId,
                hearingDate: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                matter: {
                    select: {
                        id: true,
                        title: true,
                    }
                }
            }
        })

        // Unify events
        const events = [
            ...deadlines.map(d => ({
                id: d.id,
                title: d.title,
                date: d.deadlineDate,
                type: 'deadline',
                status: d.isCompleted ? 'completed' : 'pending',
                matterId: d.matterId,
                matterTitle: d.matter.title,
            })),
            ...hearings.map(h => ({
                id: h.id,
                title: `Audiência: ${h.type || 'Geral'}`,
                date: h.hearingDate,
                type: 'hearing',
                status: h.status,
                matterId: h.matterId,
                matterTitle: h.matter.title,
                location: h.location
            }))
        ]

        return NextResponse.json(events)

    } catch (error) {
        console.error('Calendar Events Error:', error)
        return jsonError(500, { error: 'Erro interno ao carregar eventos', code: 'internal_error' })
    }
}
