import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getTransport } from '@/lib/mailer'
import { can, canAsync } from '@/lib/rbac'

type TenantSettings = {
  notifications?: {
    channels?: string[]
    deadlinesReminderDays?: number
    hearingsReminderDays?: number
  }
}

function readSettings(raw: string | null | undefined): TenantSettings {
  try { return raw ? JSON.parse(raw) as TenantSettings : {} } catch { return {} }
}

function addDays(base: Date, days: number) {
  const d = new Date(base); d.setDate(d.getDate() + days); return d
}

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2,'0')
  const mm = String(date.getMonth()+1).padStart(2,'0')
  const yyyy = date.getFullYear()
  const hh = String(date.getHours()).padStart(2,'0')
  const mi = String(date.getMinutes()).padStart(2,'0')
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId

    const allowed = can(session.user, 'alerts.send.email') || await canAsync(session.user, tenantId, 'alerts.send.email')
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const transportInfo = await getTransport(tenantId)
    if (!transportInfo) return NextResponse.json({ error: 'SMTP not configured' }, { status: 400 })

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true, name: true } })
    const settings = readSettings(tenant?.settings)
    const notif = settings?.notifications || {}
    const channels = Array.isArray(notif.channels) ? notif.channels : ['in-app']
    if (!channels.includes('email')) return NextResponse.json({ error: 'Email channel disabled' }, { status: 400 })

    const now = new Date()
    const daysDeadlines = Math.max(1, Math.min(30, Number(notif.deadlinesReminderDays ?? 3)))
    const daysHearings = Math.max(1, Math.min(30, Number(notif.hearingsReminderDays ?? 3)))
    const upcomingDeadlineEnd = addDays(now, daysDeadlines)
    const upcomingHearingEnd = addDays(now, daysHearings)

    const deadlines = await prisma.deadline.findMany({
      where: {
        tenantId,
        isCompleted: false,
        OR: [
          { deadlineDate: { gte: now, lte: upcomingDeadlineEnd } },
          { deadlineDate: { lt: now } },
        ]
      },
      include: { matter: { select: { title: true, client: { select: { name: true } } } } },
      orderBy: { deadlineDate: 'asc' }
    })

    const hearings = await prisma.hearing.findMany({
      where: { tenantId, status: 'scheduled', hearingDate: { gte: now, lte: upcomingHearingEnd } },
      include: { matter: { select: { title: true } } },
      orderBy: { hearingDate: 'asc' }
    })

    const hasAlerts = (deadlines.length + hearings.length) > 0
    if (!hasAlerts) return NextResponse.json({ success: true, sent: 0 })

    const recipients = await prisma.user.findMany({
      where: { tenantId, isActive: true, role: { in: ['partner','lawyer','secretary'] } },
      select: { email: true, fullName: true }
    })

    if (!recipients.length) return NextResponse.json({ error: 'No recipients' }, { status: 400 })

    const { transporter, from } = transportInfo

    const lines: string[] = []
    lines.push(`Escritório: ${tenant?.name || ''}`)
    lines.push('')
    if (deadlines.length) {
      lines.push('Prazos:')
      for (const d of deadlines) {
        const overdue = d.deadlineDate < now
        lines.push(`- ${d.title} • ${formatDate(d.deadlineDate)} • ${d.matter?.title || ''}${d.matter?.client?.name ? ' • '+d.matter.client.name : ''}${overdue ? ' • ATRASADO' : ''}`)
      }
      lines.push('')
    }
    if (hearings.length) {
      lines.push('Audiências:')
      for (const h of hearings) {
        lines.push(`- ${h.type || 'Audiência'} • ${formatDate(h.hearingDate)} • ${h.matter?.title || ''}`)
      }
      lines.push('')
    }

    const text = lines.join('\n')
    const subject = `Alertas do dia (${formatDate(now).slice(0,10)})`

    let sent = 0
    for (const r of recipients) {
      if (!r.email) continue
      await transporter.sendMail({
        from,
        to: r.email,
        subject,
        text,
      })
      sent++
    }

    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('Alerts Email Error:', error)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
