'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Calendar, Trash, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const deadlineSchema = z.object({
    title: z.string().min(3, 'Título obrigatório'),
    deadlineDate: z.string().min(1, 'Data obrigatória'),
})

interface Deadline {
    id: string
    title: string
    deadlineDate: string
    isCompleted: boolean
}

export function DeadlineList({ caseId }: { caseId: string }) {
    const [deadlines, setDeadlines] = useState<Deadline[]>([])
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(deadlineSchema)
    })

    const fetchDeadlines = async () => {
        try {
            const res = await fetch(`/api/cases/${caseId}/deadlines`)
            if (res.ok) setDeadlines(await res.json())
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchDeadlines()
    }, [caseId])

    const onSubmit = async (data: any) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/cases/${caseId}/deadlines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    deadlineDate: new Date(data.deadlineDate).toISOString()
                })
            })

            if (!res.ok) throw new Error()

            toast.success('Prazo adicionado!')
            setIsCreateOpen(false)
            reset()
            fetchDeadlines()
        } catch (error) {
            toast.error('Erro ao criar prazo')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleComplete = async (deadline: Deadline) => {
        // Optimistic update
        setDeadlines(prev => prev.map(d =>
            d.id === deadline.id ? { ...d, isCompleted: !d.isCompleted } : d
        ))

        try {
            await fetch(`/api/crm/deadlines/${deadline.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: !deadline.isCompleted })
            })
        } catch (error) {
            toast.error('Erro ao atualizar')
            fetchDeadlines() // Revert
        }
    }

    const deleteDeadline = async (id: string) => {
        if (!confirm('Excluir este prazo?')) return

        try {
            await fetch(`/api/crm/deadlines/${id}`, { method: 'DELETE' })
            setDeadlines(prev => prev.filter(d => d.id !== id))
            toast.success('Prazo removido')
        } catch (error) {
            toast.error('Erro ao remover')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Prazos e Tarefas</h3>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Prazo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Prazo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Título</Label>
                                <Input {...register('title')} placeholder="Ex: Contestação" />
                                {errors.title && <p className="text-red-500 text-sm">{errors.title.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Data Limite</Label>
                                <Input type="datetime-local" {...register('deadlineDate')} />
                                {errors.deadlineDate && <p className="text-red-500 text-sm">{errors.deadlineDate.message as string}</p>}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {deadlines.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center border rounded-md border-dashed">
                        Nenhum prazo cadastrado.
                    </p>
                ) : (
                    deadlines.map(deadline => (
                        <div key={deadline.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    checked={deadline.isCompleted}
                                    onCheckedChange={() => toggleComplete(deadline)}
                                    className="mt-1"
                                />
                                <div className={cn(deadline.isCompleted && "opacity-50 line-through")}>
                                    <p className="font-medium">{deadline.title}</p>
                                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {format(new Date(deadline.deadlineDate), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteDeadline(deadline.id)}>
                                <Trash className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
