import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function formatDateTimeUTC(date: Date) {
  const iso = date.toISOString().replace(/[-:]/g, '')
  return iso.replace(/\.\d{3}Z$/, 'Z')
}

function formatDateLocalYYYYMMDD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const tid = searchParams.get('tid')
    let tenantId: string | null = null

    if (token && tid) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tid }, select: { settings: true } })
      if (!tenant) return new NextResponse('Unauthorized', { status: 401 })
      try {
        const settings = tenant.settings ? JSON.parse(tenant.settings) : {}
        const calendarToken = settings?.calendar?.token
        if (typeof calendarToken === 'string' && calendarToken === token) {
          tenantId = tid
        } else {
          return new NextResponse('Unauthorized', { status: 401 })
        }
      } catch {
        return new NextResponse('Unauthorized', { status: 401 })
      }
    } else {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || !session?.user?.tenantId) {
        return new NextResponse('Unauthorized', { status: 401 })
      }
      tenantId = session.user.tenantId
    }

    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 30)
    const end = new Date(now)
    end.setDate(end.getDate() + 180)

    const deadlines = await prisma.deadline.findMany({
      where: {
        tenantId: tenantId,
        deadlineDate: { gte: start, lte: end }
      },
      include: {
        matter: { select: { title: true } }
      },
      orderBy: { deadlineDate: 'asc' }
    })

    const hearings = await prisma.hearing.findMany({
      where: {
        tenantId: tenantId,
        hearingDate: { gte: start, lte: end }
      },
      include: {
        matter: { select: { title: true } }
      },
      orderBy: { hearingDate: 'asc' }
    })

    const lines: string[] = []
    lines.push('BEGIN:VCALENDAR')
    lines.push('PRODID:-//EG Advocacia//Calendar//PT-BR')
    lines.push('VERSION:2.0')
    lines.push('CALSCALE:GREGORIAN')
    lines.push('METHOD:PUBLISH')

    const nowStamp = formatDateTimeUTC(new Date())

    // Deadlines as all-day events
    for (const d of deadlines) {
      const dt = d.deadlineDate
      const dtStart = formatDateLocalYYYYMMDD(dt)
      const dtEnd = formatDateLocalYYYYMMDD(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1))
      const summary = `Prazo: ${d.title}`
      const description = d.matter?.title ? `Processo: ${d.matter.title}` : 'Prazo'
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${d.id}@egadvocacia.local`)
      lines.push(`DTSTAMP:${nowStamp}`)
      lines.push(`SUMMARY:${summary}`)
      lines.push(`DESCRIPTION:${description}`)
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`)
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`)
      lines.push('END:VEVENT')
    }

    // Hearings as timed events (1h by default)
    for (const h of hearings) {
      const dt = h.hearingDate
      const dtStart = formatDateTimeUTC(dt)
      const dtEnd = formatDateTimeUTC(new Date(dt.getTime() + 60 * 60 * 1000))
      const summary = `Audiência: ${h.type || 'Geral'}`
      const description = h.matter?.title ? `Processo: ${h.matter.title}` : 'Audiência'
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${h.id}@egadvocacia.local`)
      lines.push(`DTSTAMP:${nowStamp}`)
      lines.push(`SUMMARY:${summary}`)
      lines.push(`DESCRIPTION:${description}`)
      if (h.location) lines.push(`LOCATION:${h.location}`)
      lines.push(`DTSTART:${dtStart}`)
      lines.push(`DTEND:${dtEnd}`)
      lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')

    const ics = lines.join('\r\n') + '\r\n'
    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="egadvocacia-calendar.ics"',
      }
    })
  } catch (error) {
    console.error('ICS Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
