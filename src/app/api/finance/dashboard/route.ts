import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { startOfMonth, endOfMonth } from 'date-fns'
import { canAsync, can } from '@/lib/rbac'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'finance.view') || await canAsync(session.user, tenantId, 'finance.view')
    if (!allowed) return new NextResponse('Forbidden', { status: 403 })
        const now = new Date()
        const firstDay = startOfMonth(now)
        const lastDay = endOfMonth(now)

        // Aggregations for current month
        const aggregations = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                tenantId,
                date: {
                    gte: firstDay,
                    lte: lastDay
                }
            },
            _sum: {
                amount: true
            }
        })

        const revenue = aggregations.find(a => a.type === 'revenue')?._sum.amount || 0
        const expense = aggregations.find(a => a.type === 'expense')?._sum.amount || 0
        const balance = revenue - expense

        // Recent transactions
        const recent = await prisma.transaction.findMany({
            where: { tenantId },
            take: 5,
            orderBy: { date: 'desc' }
        })

        return NextResponse.json({
            kpis: {
                revenue,
                expense,
                balance
            },
            recent
        })

    } catch (error) {
        console.error('Finance Dashboard Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
