import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const inviteSchema = z.object({
    email: z.string().email(),
    role: z.string()
})

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || !session?.user?.tenantId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const json = await request.json()
        const { email, role } = inviteSchema.parse(json)
        const tenantId = session.user.tenantId

        // Check if user already exists
        const existing = await prisma.user.findUnique({
            where: { email }
        })

        if (existing) {
            return new NextResponse('Usuário já existe', { status: 400 })
        }

        // Create user
        // Note: Password handling should be done via Auth provider invite flow.
        // Here we just create the placeholder record.
        const user = await prisma.user.create({
            data: {
                email,
                role,
                tenantId,
                password: uuidv4(), // Placeholder password to satisfy schema
                fullName: '' // Will be filled on first login
            }
        })

        return NextResponse.json(user)

    } catch (error) {
        console.error('Invite Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
