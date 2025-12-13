import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/api-auth'
import { jsonError } from '@/lib/api-errors'

export async function GET(request: Request) {
    try {
        const { session, errorResponse } = await requireSession()
        if (!session) return errorResponse

        const role = session.user.role
        if (!['admin', 'partner'].includes(role)) {
            return jsonError(403, { error: 'Forbidden' })
        }

        const users = await prisma.user.findMany({
            where: {
                tenantId: session.user.tenantId
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true
            },
            orderBy: {
                fullName: 'asc'
            }
        })

        return NextResponse.json(users)

    } catch (error) {
        console.error('Users List Error:', error)
        return jsonError(500, { error: 'Internal Error' })
    }
}
