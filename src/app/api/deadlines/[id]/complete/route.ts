import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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

        const { isCompleted } = await request.json()
        const tenantId = session.user.tenantId

        // Verify ownership/tenancy
        const deadline = await prisma.deadline.findFirst({
            where: {
                id: params.id,
                tenantId
            }
        })

        if (!deadline) {
            return new NextResponse('Not found', { status: 404 })
        }

        const updated = await prisma.deadline.update({
            where: {
                id: params.id
            },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null
            }
        })

        return NextResponse.json(updated)

    } catch (error) {
        console.error('Deadline Update Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
