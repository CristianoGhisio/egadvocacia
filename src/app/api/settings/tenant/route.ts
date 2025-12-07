import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1),
  cnpj: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { id: true, name: true, cnpj: true, email: true, phone: true },
    })

    if (!tenant) return new NextResponse('Not Found', { status: 404 })
    return NextResponse.json(tenant)
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
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

    const before = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } })

    const tenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        name: data.name,
        cnpj: data.cnpj || null,
        email: data.email || null,
        phone: data.phone || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: 'update',
        entityType: 'tenant',
        entityId: session.user.tenantId,
        oldData: JSON.stringify({ name: before?.name, cnpj: before?.cnpj, email: before?.email, phone: before?.phone }),
        newData: JSON.stringify({ name: tenant.name, cnpj: tenant.cnpj, email: tenant.email, phone: tenant.phone }),
      },
    })

    return NextResponse.json(tenant)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 })
    }
    return new NextResponse('Internal Error', { status: 500 })
  }
}

