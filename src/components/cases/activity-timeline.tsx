'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type ActivityItem = {
  id: string
  action: string
  description?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
  user?: { id: string; fullName: string } | null
}

export function ActivityTimeline({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('Nota')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/activities`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch {}
    setLoading(false)
  }, [caseId])

useEffect(() => { load() }, [load])

  async function add() {
    if (!action.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, description: description || undefined })
      })
      if (res.ok) {
        setAction('Nota')
        setDescription('')
        toast.success('Atividade registrada')
        load()
      } else {
        toast.error('Falha ao registrar atividade')
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Ação</Label>
              <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Ex.: Nota, Atualização de status, Ligação" />
            </div>
            <div className="grid gap-2">
              <Label>Descrição (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes da atividade" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={add} disabled={saving}>Registrar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando atividades...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">Sem atividades registradas</div>
        ) : (
          <ul className="divide-y">
            {items.map((a) => (
              <li key={a.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{a.action}</div>
                  <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                {a.description && <div className="text-sm mt-1">{a.description}</div>}
                <div className="text-xs text-muted-foreground mt-1">{a.user?.fullName || '—'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
