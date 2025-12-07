import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'

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
    const { id } = params

    const existing = await prisma.hearing.findFirst({
      where: { id, tenantId },
      select: { id: true }
    })
    if (!existing) return new NextResponse('Not found', { status: 404 })

    await prisma.hearing.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

