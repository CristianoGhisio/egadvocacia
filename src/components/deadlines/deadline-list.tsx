'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel
} from '@tanstack/react-table'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getColumns, DeadlineData } from './deadline-columns'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function DeadlineList() {
    const [data, setData] = useState<DeadlineData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('pending')
    const [filterDays, setFilterDays] = useState('all')

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (filterStatus !== 'all') params.append('status', filterStatus)
            if (filterDays !== 'all') params.append('days', filterDays)

            const res = await fetch(`/api/deadlines?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch')
            const json = await res.json()
            setData(json)
        } catch (error) {
            toast.error("Erro ao carregar prazos")
        } finally {
            setIsLoading(false)
        }
    }, [filterStatus, filterDays])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleToggleComplete = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        setData(prev => prev.map(item =>
            item.id === id ? { ...item, isCompleted: !currentStatus } : item
        ))

        try {
            const res = await fetch(`/api/deadlines/${id}/complete`, {
                method: 'PATCH',
                body: JSON.stringify({ isCompleted: !currentStatus }),
                headers: { 'Content-Type': 'application/json' }
            })
            if (!res.ok) throw new Error()
            toast.success(currentStatus ? "Prazo reaberto" : "Prazo concluído")
            fetchData() // Refresh to sort correctly if needed
        } catch (error) {
            toast.error("Erro ao atualizar status")
            // Revert optimistic
            setData(prev => prev.map(item =>
                item.id === id ? { ...item, isCompleted: currentStatus } : item
            ))
        }
    }

    const columns = getColumns({ onToggleComplete: handleToggleComplete })

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="completed">Concluídos</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterDays} onValueChange={setFilterDays}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Qualquer Data</SelectItem>
                        <SelectItem value="7">Próximos 7 dias</SelectItem>
                        <SelectItem value="30">Próximos 30 dias</SelectItem>
                        <SelectItem value="overdue">Atrasados</SelectItem>
                    </SelectContent>
                </Select>

                <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                    Atualizar
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        Carregando...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Nenhum prazo encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Próxima
                </Button>
            </div>
        </div>
    )
}
