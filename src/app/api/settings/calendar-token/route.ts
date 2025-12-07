import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { can } from '@/lib/rbac'

type CalendarTokenResponse = {
  token: string
  icsUrl: string
}

type TenantSettings = {
  calendar?: { token?: string }
}

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
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { settings: true }
    })

    const settings = readSettings(tenant?.settings)
    settings.calendar = settings.calendar || {}
    let token = settings.calendar.token as string | undefined
    if (!token || typeof token !== 'string' || token.length < 16) {
      token = crypto.randomUUID()
      settings.calendar.token = token
      await prisma.tenant.update({
        where: { id: session.user.tenantId },
        data: { settings: JSON.stringify(settings) }
      })
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || ''
    const base = origin || ''
    const icsPath = `/api/calendar/ics?tid=${encodeURIComponent(session.user.tenantId)}&token=${encodeURIComponent(token)}`
    const icsUrl = base ? `${base}${icsPath}` : icsPath

    const payload: CalendarTokenResponse = { token, icsUrl }
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Calendar Token GET Error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!can(session.user, 'settings.manage.notifications')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { settings: true }
    })

    const settings = readSettings(tenant?.settings)
    settings.calendar = settings.calendar || {}
    settings.calendar.token = crypto.randomUUID()

    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: { settings: JSON.stringify(settings) }
    })

    const origin = process.env.NEXT_PUBLIC_APP_URL || ''
    const base = origin || ''
    const icsPath = `/api/calendar/ics?tid=${encodeURIComponent(session.user.tenantId)}&token=${encodeURIComponent(settings.calendar.token)}`
    const icsUrl = base ? `${base}${icsPath}` : icsPath

    return NextResponse.json({ token: settings.calendar.token, icsUrl })
  } catch (error) {
    console.error('Calendar Token POST Error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
