import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
    isCompleted: z.boolean(),
})

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { isCompleted } = updateSchema.parse(body)

        const deadline = await prisma.deadline.update({
            where: {
                id,
                tenantId: session.user.tenantId,
            },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
            },
        })

        return NextResponse.json(deadline)
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar prazo' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params

        await prisma.deadline.delete({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao remover prazo' }, { status: 500 })
    }
}
