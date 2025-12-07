import { prisma } from '@/lib/prisma'

type UserLike = {
  role: string
}

const rolePermissions: Record<string, string[]> = {
  admin: ['*'],
  partner: [
    'settings.view',
    'settings.manage.notifications',
    'alerts.view',
    'alerts.send.email',
    'calendar.view',
    'cases.view',
    'cases.manage',
    'documents.view',
    'documents.manage',
    'documents.templates.view',
    'documents.templates.manage',
    'finance.view',
    'finance.manage',
  ],
  lawyer: [
    'alerts.view',
    'calendar.view',
    'cases.view',
    'documents.view',
    'finance.view',
  ],
  financial: [
    'calendar.view',
    'finance.view',
    'finance.manage',
  ],
  secretary: [
    'alerts.view',
    'alerts.send.email',
    'calendar.view',
    'cases.view',
    'documents.view',
  ],
  intern: [
    'calendar.view',
    'cases.view',
    'documents.view',
  ],
  client: [],
  support: [],
}

export function can(user: UserLike | null | undefined, permission: string): boolean {
  if (!user) return false
  const role = String(user.role || '')
  const perms = rolePermissions[role] || []
  if (perms.includes('*')) return true
  return perms.includes(permission)
}

export async function canAsync(user: UserLike | null | undefined, tenantId: string | null | undefined, permission: string): Promise<boolean> {
  if (!user || !tenantId) return false
  const roleName = String(user.role || '')
  try {
    const role = await prisma.role.findFirst({
      where: { tenantId, name: roleName },
      select: { permissions: true }
    })
    if (!role) return can(user, permission)
    type RolePermissionsJson = string[] | { allowed?: string[] }
    let perms: RolePermissionsJson = []
    try { perms = JSON.parse(role.permissions || '[]') as RolePermissionsJson } catch { perms = [] }
    const list: string[] = Array.isArray(perms) ? perms : Array.isArray(perms.allowed) ? (perms.allowed as string[]) : []
    if (list.includes('*')) return true
    return list.includes(permission) || can(user, permission)
  } catch {
    return can(user, permission)
  }
}
