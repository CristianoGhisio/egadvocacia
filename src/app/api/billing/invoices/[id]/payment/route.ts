import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
  paymentDate: z.string().transform((s) => new Date(s)).optional(),
  notes: z.string().optional(),
})

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const bodyJson = await request.json()
    const body = paymentSchema.parse(bodyJson)

    const tenantId = session.user.tenantId
    const invoiceId = params.id

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { payments: true }
    })

    if (!invoice) {
      return new NextResponse('Not found', { status: 404 })
    }

    const paymentDate = body.paymentDate ?? new Date()

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId,
          amount: body.amount,
          paymentMethod: body.paymentMethod,
          paymentDate,
          notes: body.notes || null,
        },
      })

      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          type: 'revenue',
          category: 'Receita - Faturas',
          description: `Pagamento fatura #${invoice.invoiceNumber}`,
          amount: body.amount,
          date: paymentDate,
          status: 'paid',
          invoiceId,
        },
      })

      await tx.payment.update({
        where: { id: payment.id },
        data: { transactionId: transaction.id },
      })

      const totalPaid = (invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0) + body.amount
      const shouldMarkPaid = totalPaid >= invoice.totalAmount

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: shouldMarkPaid ? 'paid' : invoice.status,
          paidAt: shouldMarkPaid ? paymentDate : invoice.paidAt,
        },
      })

      return { payment, transaction, invoice: updatedInvoice, totalPaid }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 })
    }
    console.error('Invoice Payment Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

