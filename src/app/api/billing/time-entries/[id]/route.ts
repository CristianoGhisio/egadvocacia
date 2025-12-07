import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const tenantId = session.user.tenantId
        const { id } = params

        await prisma.timeEntry.deleteMany({
            where: {
                id,
                tenantId, // Ensure tenancy
                // Optional: Check if userId matches or is admin
            }
        })

        return new NextResponse(null, { status: 204 })

    } catch (error) {
        console.error('Time Entry Delete Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
