'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function TenantSettingsPage() {
  const [name, setName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/settings/tenant')
        if (res.ok) {
          const data = await res.json()
          setName(data.name || '')
          setCnpj(data.cnpj || '')
          setEmail(data.email || '')
          setPhone(data.phone || '')
        }
      } catch (e) {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cnpj: cnpj || null, email: email || null, phone: phone || null }),
      })
      if (res.ok) {
        toast.success('Dados do escritório atualizados')
      } else {
        toast.error('Erro ao salvar dados do escritório')
      }
    } catch (e) {
      toast.error('Erro ao salvar dados do escritório')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Escritório</h1>
        <p className="text-muted-foreground">Atualize os dados e informações legais do escritório.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="EG Advocacia" />
              </div>
              <div className="grid gap-2">
                <Label>CNPJ</Label>
                <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@escritorio.com" />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving || loading}>Salvar</Button>
      </div>
    </div>
  )
}

