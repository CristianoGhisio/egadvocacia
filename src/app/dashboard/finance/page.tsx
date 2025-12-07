'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowUpCircle, ArrowDownCircle, Banknote } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { TransactionForm } from '@/components/finance/transaction-form'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Transaction {
    id: string
    type: 'revenue' | 'expense'
    description: string
    category: string
    amount: number
    date: string
    invoice?: {
        invoiceNumber: string
        client: { name: string }
    }
}

interface DashboardData {
    kpis: {
        revenue: number
        expense: number
        balance: number
    }
    recent: Transaction[]
}

export default function FinancePage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/finance/dashboard')
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error("Erro ao carregar dashboard financeiro", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboard()
    }, [fetchDashboard])

    const handleSuccess = () => {
        fetchDashboard()
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Financeiro</h2>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setIsFormOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Nova Movimentação
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receitas (Mês)</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(data?.kpis.revenue || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Despesas (Mês)</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(data?.kpis.expense || 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo (Mês)</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${(data?.kpis.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                            {formatCurrency(data?.kpis.balance || 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Últimas Movimentações</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {isLoading ? (
                                <p className="text-sm text-muted-foreground">Carregando...</p>
                            ) : data?.recent.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
                            ) : (
                                data?.recent.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${transaction.type === 'revenue'
                                            ? 'border-green-200 bg-green-100'
                                            : 'border-red-200 bg-red-100'
                                            }`}>
                                            {transaction.type === 'revenue'
                                                ? <ArrowUpCircle className="h-5 w-5 text-green-600" />
                                                : <ArrowDownCircle className="h-5 w-5 text-red-600" />
                                            }
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{transaction.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {transaction.category}
                                                {transaction.invoice && ` • Ref: #${transaction.invoice.invoiceNumber}`}
                                            </p>
                                        </div>
                                        <div className="ml-auto flex flex-col items-end">
                                            <div className={`font-medium ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {transaction.type === 'revenue' ? '+' : '-'}
                                                {formatCurrency(transaction.amount)}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(transaction.date), "dd MMM", { locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <TransactionForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
