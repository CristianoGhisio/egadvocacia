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

        const { searchParams } = new URL(request.url)
        const clientId = searchParams.get('clientId')
        const tenantId = session.user.tenantId

        if (!clientId) {
            return new NextResponse('Client ID required', { status: 400 })
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
        return new NextResponse('Internal Error', { status: 500 })
    }
}
