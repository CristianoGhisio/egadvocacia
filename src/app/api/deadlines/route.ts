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
        const status = searchParams.get('status') // 'pending', 'completed', 'all'
        const days = searchParams.get('days') // '7', '30', 'overdue'

        const tenantId = session.user.tenantId
        const now = new Date()

        let whereClause: any = {
            tenantId,
        }

        // Status Filter
        if (status === 'pending') {
            whereClause.isCompleted = false
        } else if (status === 'completed') {
            whereClause.isCompleted = true
        }

        // Days Filter
        if (days === 'overdue') {
            whereClause.deadlineDate = {
                lt: now
            }
            whereClause.isCompleted = false
        } else if (days === '7') {
            const nextWeek = new Date()
            nextWeek.setDate(now.getDate() + 7)
            whereClause.deadlineDate = {
                gte: now,
                lte: nextWeek
            }
        } else if (days === '30') {
            const nextMonth = new Date()
            nextMonth.setDate(now.getDate() + 30)
            whereClause.deadlineDate = {
                gte: now,
                lte: nextMonth
            }
        }

        const deadlines = await prisma.deadline.findMany({
            where: whereClause,
            include: {
                matter: {
                    select: {
                        id: true,
                        title: true,
                        clientId: true,
                        client: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                deadlineDate: 'asc'
            }
        })

        return NextResponse.json(deadlines)

    } catch (error) {
        console.error('Deadlines List Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
