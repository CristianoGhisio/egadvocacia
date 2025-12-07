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

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        client: { select: { name: true } },
        items: true,
        payments: true,
      }
    })
    if (!invoice) return new NextResponse('Not Found', { status: 404 })

    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595, 842]) // A4 portrait
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const draw = (text: string, x: number, y: number, size = 12) => {
      page.drawText(text, { x, y, size, font })
    }

    draw('EG Advocacia', 50, 800, 18)
    draw('Fatura', 50, 780, 14)
    draw(`Número: ${invoice.invoiceNumber}`, 50, 760)
    draw(`Cliente: ${invoice.client?.name || ''}`, 50, 740)
    draw(`Emissão: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, 720)
    draw(`Vencimento: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 700)
    draw(`Status: ${invoice.status}`, 50, 680)

    let y = 650
    draw('Itens', 50, y)
    y -= 20
    for (const it of invoice.items) {
      draw(`- ${it.description} · Qtde ${it.quantity} · R$ ${it.totalPrice.toFixed(2)}`, 60, y)
      y -= 16
    }

    y -= 10
    draw(`Subtotal: R$ ${invoice.subtotal.toFixed(2)}`, 50, y)
    y -= 16
    draw(`Impostos: R$ ${invoice.taxAmount.toFixed(2)}`, 50, y)
    y -= 16
    draw(`Total: R$ ${invoice.totalAmount.toFixed(2)}`, 50, y)

    if (invoice.paidAt) {
      y -= 24
      draw(`Pago em: ${new Date(invoice.paidAt).toLocaleDateString()} via ${invoice.paymentMethod || ''}`, 50, y)
    }

    const bytes = await pdf.save()
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Invoice PDF Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

