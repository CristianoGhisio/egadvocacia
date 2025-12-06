import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { unlink } from 'fs/promises'
import { z } from 'zod'

const updateSchema = z.object({
    matterId: z.string().optional().nullable(),
    clientId: z.string().optional().nullable(),
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
        const data = updateSchema.parse(body)

        const document = await prisma.document.update({
            where: {
                id,
                tenantId: session.user.tenantId
            },
            data: {
                matterId: data.matterId,
                clientId: data.clientId
            }
        })

        return NextResponse.json(document)

    } catch (error) {
        return NextResponse.json({ error: 'Erro ao atualizar documento' }, { status: 500 })
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

        const document = await prisma.document.findUnique({
            where: {
                id,
                tenantId: session.user.tenantId
            }
        })

        if (!document) {
            return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
        }

        // Delete from DB
        await prisma.document.delete({
            where: { id }
        })

        // Try delete from Disk (don't fail request if file missing)
        try {
            // storagePath is like /uploads/2025/12/uuid.pdf
            // We need absolute path
            const absolutePath = join(process.cwd(), 'public', document.storagePath)
            await unlink(absolutePath)
        } catch (err) {
            console.error('Erro ao deletar arquivo físico:', err)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao deletar documento' }, { status: 500 })
    }
}
