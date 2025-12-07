import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const tenantId = session.user.tenantId

        const invoice = await prisma.invoice.findUnique({
            where: {
                id: params.id,
                tenantId
            },
            include: {
                client: true,
                items: true,
                timeEntries: true,
                payments: true
            }
        })

        if (!invoice) return new NextResponse('Not found', { status: 404 })

        return NextResponse.json(invoice)

    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { status } = await request.json()
        const tenantId = session.user.tenantId

        const result = await prisma.$transaction(async (tx) => {
            const updatedInvoice = await tx.invoice.update({
                where: { id: params.id, tenantId },
                data: {
                    status,
                    paidAt: status === 'paid' ? new Date() : null
                },
                include: { client: true }
            })

            // If marked as paid, create a revenue transaction
            if (status === 'paid') {
                await tx.transaction.create({
                    data: {
                        tenantId,
                        type: 'revenue',
                        category: 'Honorários',
                        description: `Fatura #${updatedInvoice.invoiceNumber} - ${updatedInvoice.client.name}`,
                        amount: updatedInvoice.totalAmount,
                        date: new Date(),
                        status: 'paid',
                        invoiceId: updatedInvoice.id
                    }
                })
            }

            return updatedInvoice
        })

        return NextResponse.json(result)

    } catch (error) {
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const tenantId = session.user.tenantId
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId },
      include: { payments: true }
    })
    if (!invoice) return new NextResponse('Not found', { status: 404 })

    if (invoice.payments && invoice.payments.length > 0) {
      return new NextResponse('Cannot delete invoice with payments', { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: params.id, tenantId } })
      await tx.invoice.delete({ where: { id: params.id, tenantId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
