import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createTransactionSchema = z.object({
    type: z.enum(['revenue', 'expense']),
    category: z.string().min(1),
    description: z.string().min(1),
    amount: z.number().positive(),
    date: z.string(), // YYYY-MM-DD
    status: z.enum(['paid', 'pending']).default('paid'),
})

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const tenantId = session.user.tenantId
        const type = searchParams.get('type')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { tenantId }

        if (type) where.type = type
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                invoice: {
                    select: { invoiceNumber: true, client: { select: { name: true } } }
                }
            }
        })

        return NextResponse.json(transactions)

    } catch (error) {
        console.error('Transactions List Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const json = await request.json()
        const body = createTransactionSchema.parse(json)
        const tenantId = session.user.tenantId

        const transaction = await prisma.transaction.create({
            data: {
                tenantId,
                type: body.type,
                category: body.category,
                description: body.description,
                amount: body.amount,
                date: new Date(body.date),
                status: body.status,
            }
        })

        return NextResponse.json(transaction)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify((error as z.ZodError).issues), { status: 400 })
        }
        console.error('Transaction Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
