import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

type SmtpSettings = {
  host: string
  port: number
  secure?: boolean
  user: string
  pass: string
  from: string
}

type AppSettings = {
  smtp?: Partial<SmtpSettings> & { secure?: boolean }
  notifications?: { channels?: string[]; deadlinesReminderDays?: number; hearingsReminderDays?: number }
  calendar?: { token?: string }
}

function readSettings(raw: string | null | undefined): AppSettings {
  try { return raw ? JSON.parse(raw) as AppSettings : {} } catch { return {} }
}

export async function getTenantSmtp(tenantId: string): Promise<SmtpSettings | null> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } })
  const settings = readSettings(tenant?.settings)
  const smtp = settings.smtp
  if (!smtp) return null
  const required = ['host','port','user','pass','from']
  for (const k of required) { if (!(k in smtp)) return null }
  return {
    host: String(smtp.host),
    port: Number(smtp.port),
    secure: Boolean(smtp.secure ?? false),
    user: String(smtp.user),
    pass: String(smtp.pass),
    from: String(smtp.from)
  }
}

export async function getTransport(tenantId: string) {
  const smtp = await getTenantSmtp(tenantId)
  if (!smtp) return null
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass }
  })
  return { transporter, from: smtp.from }
}
