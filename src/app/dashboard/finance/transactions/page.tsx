'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TransactionList } from '@/components/finance/transaction-list'
import { TransactionForm } from '@/components/finance/transaction-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchJson, type PaginatedResponse } from '@/lib/api-client'
import type { TransactionListItem } from '@/components/finance/transaction-list'

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<TransactionListItem[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)

    // Filters
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)

    function refresh() {
        setPage(1)
    }

    useEffect(() => {
        async function fetchTransactions() {
            try {
                const params = new URLSearchParams()
                if (startDate) params.append('startDate', startDate)
                if (endDate) params.append('endDate', endDate)
                params.append('page', String(page))

                const data = await fetchJson<PaginatedResponse<TransactionListItem>>(`/api/finance/transactions?${params.toString()}`)
                setTransactions(data.data)
                setPage(data.pagination.page)
                setPageCount(data.pagination.pageCount)
            } catch (error) {
                console.error(error)
            }
        }

        fetchTransactions()
    }, [startDate, endDate, page])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Transações</h1>
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Transação
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="grid gap-2">
                            <Label>Data Início</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Data Fim</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" onClick={() => { setStartDate(''); setEndDate('') }}>
                            Limpar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <TransactionList transactions={transactions} onChanged={refresh} />

            {transactions.length > 0 && (
                <div className="flex items-center justify-end gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Página {page} de {pageCount}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pageCount}
                        onClick={() => setPage((current) => (current < pageCount ? current + 1 : current))}
                    >
                        Próxima
                    </Button>
                </div>
            )}

            <TransactionForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSuccess={refresh}
            />
        </div>
    )
}
