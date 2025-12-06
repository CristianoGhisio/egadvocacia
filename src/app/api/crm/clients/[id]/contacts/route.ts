import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const contactSchema = z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    role: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    isPrimary: z.boolean().default(false),
})

// GET /api/crm/clients/[id]/contacts - List client contacts
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { id } = await params

        // Verify client belongs to tenant
        const client = await prisma.client.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        if (!client) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        const contacts = await prisma.contact.findMany({
            where: {
                clientId: id,
            },
            orderBy: [
                { isPrimary: 'desc' },
                { createdAt: 'desc' }
            ]
        })

        return NextResponse.json(contacts)
    } catch (error) {
        console.error('Error fetching contacts:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar contatos' },
            { status: 500 }
        )
    }
}

// POST /api/crm/clients/[id]/contacts - Create contact
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await request.json()

        // Validate input
        const validatedData = contactSchema.parse(body)

        // Verify client belongs to tenant
        const client = await prisma.client.findFirst({
            where: {
                id,
                tenantId: session.user.tenantId,
            }
        })

        if (!client) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        // If isPrimary is true, set other contacts as non-primary
        if (validatedData.isPrimary) {
            await prisma.contact.updateMany({
                where: {
                    clientId: id,
                    isPrimary: true
                },
                data: {
                    isPrimary: false
                }
            })
        }

        const contact = await prisma.contact.create({
            data: {
                ...validatedData,
                clientId: id,
                tenantId: session.user.tenantId,
            }
        })

        return NextResponse.json(contact, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: (error as z.ZodError).issues },
                { status: 400 }
            )
        }

        console.error('Error creating contact:', error)
        return NextResponse.json(
            { error: 'Erro ao criar contato' },
            { status: 500 }
        )
    }
}
