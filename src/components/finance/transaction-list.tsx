'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react"
import { useState } from "react"

interface Transaction {
    id: string
    type: 'revenue' | 'expense'
    category: string
    description: string
    amount: number
    date: string
    status: 'paid' | 'pending'
    invoice?: {
        invoiceNumber: string
        client: {
            name: string
        }
    }
}

interface TransactionListProps {
    transactions: Transaction[]
    onChanged?: () => void
}

export function TransactionList({ transactions, onChanged }: TransactionListProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null)
    if (transactions.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                Nenhuma transação encontrada para este período.
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell>
                                {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {transaction.type === 'revenue' ? (
                                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className="capitalize">
                                        {transaction.type === 'revenue' ? 'Receita' : 'Despesa'}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span>{transaction.description}</span>
                                    {transaction.invoice && (
                                        <span className="text-xs text-muted-foreground">
                                            Fatura #{transaction.invoice.invoiceNumber} - {transaction.invoice.client.name}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>{transaction.category}</TableCell>
                            <TableCell className={transaction.type === 'revenue' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                {transaction.type === 'expense' ? '-' : '+'}
                                {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell>
                                <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                                    {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Excluir"
                                        onClick={() => setDeleteId(transaction.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {deleteId && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50" />
                    <dialog
                        open
                        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-md p-6 shadow-xl"
                    >
                        <div className="space-y-3">
                            <div className="text-lg font-semibold">Excluir Transação</div>
                            <div className="text-sm text-muted-foreground">Esta ação é definitiva e não poderá ser desfeita.</div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="px-3 py-2 border rounded" onClick={() => setDeleteId(null)}>Cancelar</button>
                                <button
                                    className="px-3 py-2 bg-red-600 text-white rounded"
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`/api/finance/transactions/${deleteId}`, { method: 'DELETE' })
                                            if (!res.ok) throw new Error()
                                            setDeleteId(null)
                                            if (onChanged) onChanged()
                                        } catch {}
                                    }}
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </dialog>
                </>
            )}
        </div>
    )
}
