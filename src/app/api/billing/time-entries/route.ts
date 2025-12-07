import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createTimeEntrySchema = z.object({
    description: z.string().min(1, "Descrição é obrigatória"),
    hours: z.number().min(0.1, "Mínimo de 0.1 horas"),
    date: z.string().transform(str => new Date(str)),
    matterId: z.string().optional().nullable(),
    clientId: z.string().optional().nullable(),
    billable: z.boolean().default(true),
})

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date') // YYYY-MM-DD

        const tenantId = session.user.tenantId
        const userId = session.user.id

        const whereClause: any = {
            tenantId,
            userId // Only list own entries for now, or admin could see all
        }

        if (date) {
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)

            whereClause.date = {
                gte: startOfDay,
                lte: endOfDay
            }
        }

        const entries = await prisma.timeEntry.findMany({
            where: whereClause,
            include: {
                matter: {
                    select: {
                        id: true,
                        title: true,
                        client: { select: { name: true } }
                    }
                },
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(entries)

    } catch (error) {
        console.error('Time Entries List Error:', error)
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
        const body = createTimeEntrySchema.parse(json)

        const tenantId = session.user.tenantId
        const userId = session.user.id

        // If matterId is provided, get clientId from it if not explicit
        let clientId = body.clientId
        if (body.matterId && !clientId) {
            const matter = await prisma.matter.findUnique({
                where: { id: body.matterId },
                select: { clientId: true }
            })
            if (matter) clientId = matter.clientId
        }

        const entry = await prisma.timeEntry.create({
            data: {
                tenantId,
                userId,
                description: body.description,
                hours: body.hours,
                date: body.date,
                matterId: body.matterId,
                clientId: clientId,
                billable: body.billable,
            }
        })

        return NextResponse.json(entry)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify((error as z.ZodError).issues), { status: 400 })
        }
        console.error('Time Entry Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
