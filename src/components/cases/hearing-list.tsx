'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { MapPin, Plus, Gavel } from 'lucide-react'

const hearingSchema = z.object({
    hearingDate: z.string().min(1, 'Data obrigatória'),
    type: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
})

interface Hearing {
    id: string
    hearingDate: string
    type: string | null
    location: string | null
    status: 'scheduled' | 'completed' | 'cancelled'
}

type HearingInput = z.input<typeof hearingSchema>

export function HearingList({ caseId }: { caseId: string }) {
    const [hearings, setHearings] = useState<Hearing[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<HearingInput>({
        resolver: zodResolver(hearingSchema),
        defaultValues: {
            status: 'scheduled',
            type: 'Conciliação'
        }
    })

    const fetchHearings = useCallback(async () => {
        try {
            const res = await fetch(`/api/cases/${caseId}/hearings`)
            if (res.ok) setHearings(await res.json())
        } catch (error) {
            console.error(error)
        }
    }, [caseId])

    useEffect(() => {
        fetchHearings()
    }, [fetchHearings])

    const onSubmit = async (data: HearingInput) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/cases/${caseId}/hearings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    hearingDate: new Date(data.hearingDate).toISOString()
                })
            })

            if (!res.ok) throw new Error()

            toast.success('Audiência agendada!')
            setIsCreateOpen(false)
            reset()
            fetchHearings()
        } catch (error) {
            toast.error('Erro ao agendar')
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Agendada</span>
            case 'completed': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Realizada</span>
            case 'cancelled': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Cancelada</span>
            default: return null
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Audiências</h3>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Audiência
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Agendar Audiência</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Data e Hora</Label>
                                    <Input type="datetime-local" {...register('hearingDate')} />
                                    {errors.hearingDate && <p className="text-red-500 text-sm">{errors.hearingDate.message as string}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipo</Label>
                                    <Select
                                        onValueChange={(val) => setValue('type', val)}
                                        defaultValue="Conciliação"
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Conciliação">Conciliação</SelectItem>
                                            <SelectItem value="Instrução">Instrução</SelectItem>
                                            <SelectItem value="Una">Una</SelectItem>
                                            <SelectItem value="Julgamento">Julgamento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Local (Link ou Endereço)</Label>
                                <Input {...register('location')} placeholder="Sala de Audiências Virtual ou Fórum Central..." />
                            </div>

                            <div className="space-y-2">
                                <Label>Anotações</Label>
                                <Textarea {...register('notes')} placeholder="Detalhes importantes..." />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Agendando...' : 'Agendar'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {hearings.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center border rounded-md border-dashed">
                        Nenhuma audiência agendada.
                    </p>
                ) : (
                    hearings.map(hearing => (
                        <div key={hearing.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-white">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <Gavel className="h-4 w-4 text-purple-600" />
                                    <span className="font-semibold">{hearing.type || 'Audiência'}</span>
                                    {getStatusBadge(hearing.status)}
                                </div>
                                <span className="text-sm font-medium">
                                    {format(new Date(hearing.hearingDate), "dd MMM, HH:mm", { locale: ptBR })}
                                </span>
                            </div>

                            {hearing.location && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {hearing.location}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
