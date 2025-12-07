'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export type DeadlineData = {
    id: string
    title: string
    deadlineDate: string
    isCompleted: boolean
    matter: {
        id: string
        title: string
        clientId: string
        client: {
            name: string
        }
    }
}

interface ColumnsProps {
    onToggleComplete: (id: string, currentStatus: boolean) => void
}

export const getColumns = ({ onToggleComplete }: ColumnsProps): ColumnDef<DeadlineData>[] => [
    {
        accessorKey: 'status',
        header: '',
        cell: ({ row }) => {
            const isCompleted = row.original.isCompleted
            return (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onToggleComplete(row.original.id, isCompleted)}
                >
                    {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-green-500" />
                    )}
                </Button>
            )
        },
    },
    {
        accessorKey: 'title',
        header: 'Título',
        cell: ({ row }) => {
            const isCompleted = row.original.isCompleted
            return <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>{row.getValue('title')}</span>
        }
    },
    {
        accessorKey: 'deadlineDate',
        header: 'Vencimento',
        cell: ({ row }) => {
            const date = new Date(row.getValue('deadlineDate'))
            const isOverdue = date < new Date() && !row.original.isCompleted
            return (
                <span className={isOverdue ? 'text-red-500 font-bold' : ''}>
                    {format(date, "dd 'de' MMM, yyyy", { locale: ptBR })}
                </span>
            )
        },
    },
    {
        accessorKey: 'matter.client.name',
        header: 'Cliente',
    },
    {
        accessorKey: 'matter.title',
        header: 'Processo',
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate" title={row.original.matter.title}>{row.original.matter.title}</div>
        )
    },
    {
        id: 'actions',
        cell: ({ row }) => (
            <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/cases/${row.original.matter.id}`}>
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </Button>
        ),
    },
]
