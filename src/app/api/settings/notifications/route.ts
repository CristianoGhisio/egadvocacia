import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { can, canAsync } from '@/lib/rbac'

type NotificationsSettings = {
  deadlinesReminderDays?: number
  hearingsReminderDays?: number
  channels?: string[]
}

function clampDays(n: number, min = 1, max = 30) {
  return Math.max(min, Math.min(max, n))
}

type TenantSettings = { notifications?: NotificationsSettings }

function readSettings(raw: string | null | undefined): TenantSettings {
  try {
    return raw ? JSON.parse(raw) as TenantSettings : {}
  } catch {
    return {}
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { settings: true }
    })

    const settings = readSettings(tenant?.settings)
    const notifications = settings.notifications || {}
    const payload: NotificationsSettings = {
      deadlinesReminderDays: typeof notifications.deadlinesReminderDays === 'number' ? notifications.deadlinesReminderDays : 3,
      hearingsReminderDays: typeof notifications.hearingsReminderDays === 'number' ? notifications.hearingsReminderDays : 3,
      channels: Array.isArray(notifications.channels) ? notifications.channels : ['in-app'],
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Notifications Settings GET Error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user, 'settings.manage.notifications') && !(await canAsync(session.user, session.user.tenantId, 'settings.manage.notifications')) ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const json = await request.json()
    const updates: NotificationsSettings = {}
    if (typeof json.deadlinesReminderDays === 'number') updates.deadlinesReminderDays = clampDays(json.deadlinesReminderDays)
    if (typeof json.hearingsReminderDays === 'number') updates.hearingsReminderDays = clampDays(json.hearingsReminderDays)
    if (Array.isArray(json.channels)) updates.channels = json.channels

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { settings: true }
    })
    const settings = readSettings(tenant?.settings)
    settings.notifications = {
      ...(settings.notifications || {}),
      ...updates,
    }

    const updated = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: { settings: JSON.stringify(settings) },
      select: { settings: true }
    })

    return NextResponse.json(readSettings(updated.settings).notifications)
  } catch (error) {
    console.error('Notifications Settings PATCH Error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
