'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export default function NotificationsSettingsPage() {
  const [deadlinesDays, setDeadlinesDays] = useState<number>(3)
  const [hearingsDays, setHearingsDays] = useState<number>(3)
  const [isSaving, setIsSaving] = useState(false)
  const [icsUrl, setIcsUrl] = useState<string>('')
  const [isRotating, setIsRotating] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState<boolean>(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings/notifications')
        if (res.ok) {
          const data = await res.json()
          setDeadlinesDays(Number(data.deadlinesReminderDays ?? 3))
          setHearingsDays(Number(data.hearingsReminderDays ?? 3))
          const channels = Array.isArray(data.channels) ? data.channels : ['in-app']
          setEmailEnabled(channels.includes('email'))
        }
        const ct = await fetch('/api/settings/calendar-token')
        if (ct.ok) {
          const d = await ct.json()
          setIcsUrl(String(d.icsUrl || ''))
        }
      } catch (e) {}
    }
    load()
  }, [])

  async function save() {
    setIsSaving(true)
    try {
      const channels = emailEnabled ? ['in-app','email'] : ['in-app']
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadlinesReminderDays: deadlinesDays, hearingsReminderDays: hearingsDays, channels }),
      })
      if (res.ok) {
        toast.success('Preferências de notificações salvas')
      } else if (res.status === 403) {
        toast.error('Sem permissão para alterar notificações')
      } else {
        toast.error('Falha ao salvar preferências')
      }
    } catch (e) {
      toast.error('Erro ao salvar preferências')
    } finally {
      setIsSaving(false)
    }
  }

  async function rotateToken() {
    setIsRotating(true)
    try {
      const res = await fetch('/api/settings/calendar-token', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setIcsUrl(String(data.icsUrl || ''))
        toast.success('Token de calendário atualizado')
      } else if (res.status === 403) {
        toast.error('Sem permissão para rotacionar token')
      } else {
        toast.error('Falha ao atualizar token')
      }
    } catch (e) {
      toast.error('Erro ao atualizar token')
    } finally {
      setIsRotating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
        <p className="text-muted-foreground">Defina lembretes para prazos e audiências.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>Dias de antecedência para alertas in-app.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Alertas de Prazos (dias)</Label>
              <Input type="number" min={1} max={30} value={deadlinesDays} onChange={(e) => setDeadlinesDays(Number(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label>Alertas de Audiências (dias)</Label>
              <Input type="number" min={1} max={30} value={hearingsDays} onChange={(e) => setHearingsDays(Number(e.target.value))} />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Checkbox checked={emailEnabled} onCheckedChange={(v) => setEmailEnabled(Boolean(v))} />
              <Label className="cursor-pointer">Enviar alertas também por e‑mail</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requer SMTP configurado em Configurações do Escritório.</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={save} disabled={isSaving}>Salvar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integração com Calendário</CardTitle>
          <CardDescription>Assine o feed ICS no Google/Outlook.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label>URL do ICS</Label>
            <Input readOnly value={icsUrl || ''} />
            <p className="text-xs text-muted-foreground">Copie este link e adicione como calendário por URL. O token garante acesso sem login.</p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={rotateToken} disabled={isRotating}>Gerar novo token</Button>
              <Button variant="outline" onClick={async () => {
                setSendingEmail(true)
                try {
                  const res = await fetch('/api/alerts/send-email', { method: 'POST' })
                  if (res.ok) {
                    const data = await res.json()
                    toast.success(`E-mails enviados: ${Number(data.sent || 0)}`)
                  } else if (res.status === 400) {
                    const d = await res.json().catch(() => ({}))
                    toast.error(String(d.error || 'Configuração ausente'))
                  } else if (res.status === 403) {
                    toast.error('Sem permissão para enviar alertas por e‑mail')
                  } else {
                    toast.error('Falha ao enviar e‑mails')
                  }
                } catch {
                  toast.error('Erro ao enviar e‑mails')
                } finally {
                  setSendingEmail(false)
                }
              }} disabled={sendingEmail}>Enviar alertas por e‑mail agora</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
