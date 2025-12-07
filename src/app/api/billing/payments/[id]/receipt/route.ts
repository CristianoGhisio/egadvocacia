import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { can, canAsync } from '@/lib/rbac'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) return new NextResponse('Unauthorized', { status: 401 })

    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'finance.view') || await canAsync(session.user, tenantId, 'finance.view')
    if (!allowed) return new NextResponse('Forbidden', { status: 403 })

    const { id } = await params

    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        invoice: { include: { client: { select: { name: true } } } }
      }
    })
    if (!payment) return new NextResponse('Not Found', { status: 404 })

    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595, 842])
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const draw = (text: string, x: number, y: number, size = 12) => page.drawText(text, { x, y, size, font })

    draw('EG Advocacia', 50, 800, 18)
    draw('Recibo de Pagamento', 50, 780, 14)
    draw(`Fatura: ${payment.invoice?.invoiceNumber || ''}`, 50, 760)
    draw(`Cliente: ${payment.invoice?.client?.name || ''}`, 50, 740)
    draw(`Data do Pagamento: ${new Date(payment.paymentDate).toLocaleDateString()}`, 50, 720)
    draw(`Método: ${payment.paymentMethod}`, 50, 700)
    draw(`Valor: R$ ${payment.amount.toFixed(2)}`, 50, 680)

    const bytes = await pdf.save()
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${payment.id}.pdf"`
      }
    })
  } catch (error) {
    console.error('Receipt PDF Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

