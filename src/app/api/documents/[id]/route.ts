import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { join } from 'path'
import { unlink } from 'fs/promises'
import { can, canAsync } from '@/lib/rbac'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const tenantId = session.user.tenantId
    const allowed = can(session.user, 'documents.manage') || await canAsync(session.user, tenantId, 'documents.manage')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const doc = await prisma.document.findFirst({
      where: { id, tenantId },
      select: { id: true, storagePath: true }
    })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Remove physical file (best-effort)
    if (doc.storagePath) {
      const absolute = join(process.cwd(), 'public', doc.storagePath)
      try { await unlink(absolute) } catch {}
    }

    await prisma.$transaction(async (tx) => {
      await tx.documentVersion.deleteMany({ where: { documentId: id, tenantId } })
      await tx.document.delete({ where: { id, tenantId } })
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session.user.id,
          action: 'delete',
          entityType: 'document',
          entityId: id,
          oldData: null,
          newData: null,
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Document Delete Error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
