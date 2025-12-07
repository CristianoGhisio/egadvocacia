import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  fullName: z.string().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    const role = session.user.role
    if (!['admin', 'partner'].includes(role)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const json = await request.json()
    const data = updateSchema.parse(json)

    const existing = await prisma.user.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      select: { id: true }
    })
    if (!existing) return new NextResponse('Not found', { status: 404 })

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: { id: true, fullName: true, email: true, role: true, isActive: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 })
    }
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
    const role = session.user.role
    if (!['admin', 'partner'].includes(role)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const existing = await prisma.user.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
      select: { id: true }
    })
    if (!existing) return new NextResponse('Not found', { status: 404 })

    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}
