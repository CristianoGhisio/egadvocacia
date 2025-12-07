import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { addDays } from 'date-fns'

const createInvoiceSchema = z.object({
    clientId: z.string().min(1),
    timeEntryIds: z.array(z.string()).min(1),
    dueDate: z.string().optional(), // YYYY-MM-DD
    hourlyRate: z.number().min(0).default(300), // Default rate if not configured
})

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const tenantId = session.user.tenantId
        const status = searchParams.get('status')

        const whereClause: any = { tenantId }
        if (status) whereClause.status = status

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                client: { select: { name: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(invoices)

    } catch (error) {
        console.error('Invoices List Error:', error)
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
        const body = createInvoiceSchema.parse(json)
        const tenantId = session.user.tenantId

        // 1. Fetch time entries to verify and calculate total
        const timeEntries = await prisma.timeEntry.findMany({
            where: {
                id: { in: body.timeEntryIds },
                tenantId,
                invoiceId: null, // Ensure not already billed
                clientId: body.clientId // Ensure belongs to correct client
            }
        })

        if (timeEntries.length !== body.timeEntryIds.length) {
            return new NextResponse('Some time entries are invalid or already billed', { status: 400 })
        }

        // 2. Calculate totals
        const totalHours = timeEntries.reduce((acc, entry) => acc + entry.hours, 0)
        const amount = totalHours * body.hourlyRate

        // 3. Generate Invoice Number (Simple auto-increment logic or random)
        // ideally we check max invoice number for tenant.
        const lastInvoice = await prisma.invoice.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        })
        const nextNum = lastInvoice ? String(Number(lastInvoice.invoiceNumber) + 1).padStart(4, '0') : '0001'

        // 4. Create Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Invoice
            const invoice = await tx.invoice.create({
                data: {
                    tenantId,
                    clientId: body.clientId,
                    invoiceNumber: nextNum,
                    issueDate: new Date(),
                    dueDate: body.dueDate ? new Date(body.dueDate) : addDays(new Date(), 14), // Default 14 days
                    subtotal: amount,
                    totalAmount: amount, // Tax logic can be added later
                    status: 'pending',
                    // Create items based on entries
                    items: {
                        create: timeEntries.map(entry => ({
                            tenantId,
                            description: entry.description,
                            quantity: entry.hours,
                            unitPrice: body.hourlyRate,
                            totalPrice: entry.hours * body.hourlyRate
                        }))
                    }
                }
            })

            // Link Time Entries to Invoice
            await tx.timeEntry.updateMany({
                where: { id: { in: body.timeEntryIds } },
                data: { invoiceId: invoice.id }
            })

            return invoice
        })

        return NextResponse.json(result)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify((error as z.ZodError).issues), { status: 400 })
        }
        console.error('Invoice Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
