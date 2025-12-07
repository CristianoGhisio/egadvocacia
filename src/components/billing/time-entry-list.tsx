'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export interface TimeEntry {
    id: string
    description: string
    hours: number
    date: string
    billable: boolean
    matter?: {
        title: string
        client: { name: string }
    }
}

interface TimeEntryListProps {
    entries: TimeEntry[]
    onDelete: (id: string) => void
}

export function TimeEntryList({ entries, onDelete }: TimeEntryListProps) {

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/billing/time-entries/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error()
            toast.success("Lançamento removido")
            onDelete(id)
        } catch (error) {
            toast.error("Erro ao remover")
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente / Caso</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Horas</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Nenhum lançamento encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        entries.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>
                                    {format(new Date(entry.date), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{entry.matter?.client.name || '-'}</span>
                                        <span className="text-xs text-muted-foreground">{entry.matter?.title}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {entry.hours.toFixed(1)}h
                                    {!entry.billable && (
                                        <span className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded">
                                            Não Faturável
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(entry.id)}
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
