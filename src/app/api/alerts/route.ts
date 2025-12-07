import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

type AlertItem = {
  id: string
  type: 'deadline' | 'hearing'
  title: string
  date: string
  daysUntil: number
  matterTitle?: string | null
  clientName?: string | null
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || !session?.user?.tenantId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const tenantId = session.user.tenantId
    const now = new Date()

    // Load tenant settings for notifications preferences
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    })

    let deadlinesReminderDays = 3
    let hearingsReminderDays = 3
    try {
      const settings = tenant?.settings ? JSON.parse(tenant.settings || '{}') : {}
      const notif = settings?.notifications || {}
      if (typeof notif.deadlinesReminderDays === 'number') deadlinesReminderDays = Math.max(1, Math.min(30, notif.deadlinesReminderDays))
      if (typeof notif.hearingsReminderDays === 'number') hearingsReminderDays = Math.max(1, Math.min(30, notif.hearingsReminderDays))
    } catch {
    }

    const addDays = (base: Date, days: number) => {
      const d = new Date(base)
      d.setDate(d.getDate() + days)
      return d
    }

    const upcomingDeadlineEnd = addDays(now, deadlinesReminderDays)
    const upcomingHearingEnd = addDays(now, hearingsReminderDays)

    // Deadlines: pending upcoming within window OR overdue
    const deadlines = await prisma.deadline.findMany({
      where: {
        tenantId,
        isCompleted: false,
        OR: [
          { deadlineDate: { gte: now, lte: upcomingDeadlineEnd } },
          { deadlineDate: { lt: now } },
        ]
      },
      include: {
        matter: {
          select: {
            title: true,
            client: { select: { name: true } }
          }
        }
      },
      orderBy: { deadlineDate: 'asc' }
    })

    // Hearings: scheduled upcoming within window
    const hearings = await prisma.hearing.findMany({
      where: {
        tenantId,
        status: 'scheduled',
        hearingDate: { gte: now, lte: upcomingHearingEnd }
      },
      include: {
        matter: { select: { title: true } }
      },
      orderBy: { hearingDate: 'asc' }
    })

    const msPerDay = 24 * 60 * 60 * 1000
    const toDaysUntil = (date: Date) => Math.ceil((date.getTime() - now.getTime()) / msPerDay)

    const alerts: AlertItem[] = [
      ...deadlines.map(d => ({
        id: d.id,
        type: 'deadline' as const,
        title: d.title,
        date: d.deadlineDate.toISOString(),
        daysUntil: toDaysUntil(d.deadlineDate),
        matterTitle: d.matter?.title || null,
        clientName: d.matter?.client?.name || null,
      })),
      ...hearings.map(h => ({
        id: h.id,
        type: 'hearing' as const,
        title: `Audiência: ${h.type || 'Geral'}`,
        date: h.hearingDate.toISOString(),
        daysUntil: toDaysUntil(h.hearingDate),
        matterTitle: h.matter?.title || null,
        clientName: null,
      })),
    ]

    // Sort by date ascending
    alerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(alerts)

  } catch (error) {
    console.error('Alerts Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

