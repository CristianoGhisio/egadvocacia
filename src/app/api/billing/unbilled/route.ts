import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/api-auth'
import { jsonError } from '@/lib/api-errors'

export async function GET(request: Request) {
    try {
        const { session, errorResponse } = await requireSession()
        if (!session) return errorResponse

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get('clientId')
        const tenantId = session.user.tenantId

        if (!clientId) {
            return jsonError(400, { error: 'Client ID required' })
        }

        const entries = await prisma.timeEntry.findMany({
            where: {
                tenantId,
                clientId,
                invoiceId: null, // Unbilled
                billable: true,
            },
            include: {
                matter: {
                    select: {
                        title: true,
                        processNumber: true
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        return NextResponse.json(entries)

    } catch (error) {
        console.error('Unbilled Entries Error:', error)
        return jsonError(500, { error: 'Internal Error' })
    }
}
