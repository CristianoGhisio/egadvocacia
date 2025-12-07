'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface Client {
    id: string
    name: string
}

interface UnbilledEntry {
    id: string
    date: string
    hours: number
    description: string
    matter?: {
        title: string
        processNumber: string | null
    }
}

export default function NewInvoicePage() {
    const router = useRouter()
    const [step, setStep] = useState(1)

    // Data Step 1 (Client)
    const [clients, setClients] = useState<Client[]>([])
    const [selectedClientId, setSelectedClientId] = useState<string>('')

    // Data Step 2 (Entries)
    const [unbilledEntries, setUnbilledEntries] = useState<UnbilledEntry[]>([])
    const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([])
    const [hourlyRate, setHourlyRate] = useState<number>(300)
    const [dueDate, setDueDate] = useState<string>('')

    // Loading states
    const [isLoadingEntries, setIsLoadingEntries] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // step 1: fetch clients
    useEffect(() => {
        async function loadClients() {
            try {
                const res = await fetch('/api/crm/clients')
                if (res.ok) {
                    const data = await res.json()
                    setClients(data)
                }
            } finally {
                // done
            }
        }
        loadClients()
    }, [])

    // step 2: fetch unbilled when client selected
    useEffect(() => {
        if (!selectedClientId) return
        async function loadUnbilled() {
            setIsLoadingEntries(true)
            try {
                const res = await fetch(`/api/billing/unbilled?clientId=${selectedClientId}`)
                if (res.ok) {
                    const data = await res.json()
                    setUnbilledEntries(data)
                    // Select all by default
                    setSelectedEntryIds(data.map((e: UnbilledEntry) => e.id))
                }
            } finally {
                setIsLoadingEntries(false)
            }
        }
        loadUnbilled()
    }, [selectedClientId])

    const handleCreateInvoice = async () => {
        if (selectedEntryIds.length === 0) {
            toast.error("Selecione pelo menos um lançamento")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/billing/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClientId,
                    timeEntryIds: selectedEntryIds,
                    hourlyRate,
                    dueDate: dueDate || undefined
                })
            })

            if (!res.ok) throw new Error()

            toast.success("Fatura criada com sucesso!")
            router.push('/dashboard/billing')
        } catch (error) {
            toast.error("Erro ao criar fatura")
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalHours = unbilledEntries
        .filter(e => selectedEntryIds.includes(e.id))
        .reduce((acc, e) => acc + e.hours, 0)

    const totalAmount = totalHours * hourlyRate

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-8">Nova Fatura</h2>

            {/* Step 1: Client Selection */}
            <Card className={step === 1 ? 'border-primary ring-1 ring-primary' : ''}>
                <CardHeader>
                    <CardTitle>1. Selecionar Cliente</CardTitle>
                    <CardDescription>Para quem esta fatura será emitida?</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={step > 1}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente..." />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {step === 1 && (
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!selectedClientId}
                                >
                                    Próximo
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: Select Entries & Configure */}
            {step >= 2 && (
                <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader>
                        <CardTitle>2. Lançamentos e Valores</CardTitle>
                        <CardDescription>Selecione as horas para faturar e confirme os valores.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoadingEntries ? (
                            <div>Carregando lançamentos...</div>
                        ) : unbilledEntries.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Nenhuma hora não faturada encontrada para este cliente.
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {unbilledEntries.map(entry => (
                                        <div key={entry.id} className="flex items-center space-x-4 border p-4 rounded-lg">
                                            <Checkbox
                                                checked={selectedEntryIds.includes(entry.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedEntryIds([...selectedEntryIds, entry.id])
                                                    else setSelectedEntryIds(selectedEntryIds.filter(id => id !== entry.id))
                                                }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <p className="font-medium">
                                                        {format(new Date(entry.date), "dd/MM/yyyy")} - {entry.matter?.title || 'Avulso'}
                                                    </p>
                                                    <span className="font-bold">{entry.hours}h</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{entry.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <Label>Valor Hora (R$)</Label>
                                        <Input
                                            type="number"
                                            value={hourlyRate}
                                            onChange={(e) => setHourlyRate(Number(e.target.value))}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Vencimento</Label>
                                        <Input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="col-span-2 pt-4 border-t flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Horas: {totalHours.toFixed(1)}h</p>
                                            <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                                        </div>
                                        <Button onClick={handleCreateInvoice} disabled={isSubmitting || selectedEntryIds.length === 0}>
                                            {isSubmitting ? 'Gerando...' : 'Gerar Fatura'}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex justify-start">
                            <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>Voltar</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
