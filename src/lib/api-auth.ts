import { getServerSession } from 'next-auth'
import type { NextRequest } from 'next/server'
import { authOptions } from '@/auth'
import { jsonError } from '@/lib/api-errors'
import { can, canAsync } from '@/lib/rbac'

export async function requireSession() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return { session: null, errorResponse: jsonError(401, { error: 'Não autenticado', code: 'unauthorized' }) }
  }

  return { session, errorResponse: null as null }
}

export async function requirePermission(
  request: NextRequest,
  permission: string
) {
  const { session, errorResponse } = await requireSession()

  if (!session) {
    return { session: null, errorResponse }
  }

  const tenantId = session.user.tenantId
  const allowed = can(session.user, permission) || (await canAsync(session.user, tenantId, permission))

  if (!allowed) {
    return {
      session: null,
      errorResponse: jsonError(403, {
        error: 'Forbidden',
        code: 'forbidden',
      }),
    }
  }

  return { session, errorResponse: null as null }
}

