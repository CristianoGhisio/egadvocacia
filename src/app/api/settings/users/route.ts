import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }
        const role = session.user.role
        if (!['admin', 'partner'].includes(role)) {
            return new NextResponse('Forbidden', { status: 403 })
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
        return new NextResponse('Internal Error', { status: 500 })
    }
}
