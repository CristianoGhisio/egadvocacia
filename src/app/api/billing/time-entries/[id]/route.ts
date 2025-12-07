import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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

    const entry = await prisma.timeEntry.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      select: { id: true }
    })
    if (!entry) return new NextResponse('Not found', { status: 404 })

    await prisma.timeEntry.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Time Entry Delete Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
