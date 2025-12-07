'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TransactionList } from '@/components/finance/transaction-list'
import { TransactionForm } from '@/components/finance/transaction-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([])
    const [isFormOpen, setIsFormOpen] = useState(false)

    // Filters
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    // Trigger for reloading data
    const [version, setVersion] = useState(0)

    function refresh() {
        setVersion(v => v + 1)
    }

    useEffect(() => {
        async function fetchTransactions() {
            try {
                const params = new URLSearchParams()
                if (startDate) params.append('startDate', startDate)
                if (endDate) params.append('endDate', endDate)

                const res = await fetch(`/api/finance/transactions?${params.toString()}`)
                if (res.ok) {
                    const data = await res.json()
                    setTransactions(data)
                }
            } catch (error) {
                console.error(error)
            }
        }

        fetchTransactions()
    }, [startDate, endDate, version])

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

            <TransactionForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSuccess={refresh}
            />
        </div>
    )
}
