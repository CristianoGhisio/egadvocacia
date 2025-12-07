import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { can, canAsync } from '@/lib/rbac'

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
    const allowed = can(session.user, 'finance.manage') || await canAsync(session.user, tenantId, 'finance.manage')
    if (!allowed) return new NextResponse('Forbidden', { status: 403 })

    const tx = await prisma.transaction.findFirst({
      where: { id: params.id, tenantId },
      select: { id: true }
    })
    if (!tx) return new NextResponse('Not found', { status: 404 })

    await prisma.transaction.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Transaction Delete Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
