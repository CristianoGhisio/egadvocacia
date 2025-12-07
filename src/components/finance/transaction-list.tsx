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
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react"

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
}

export function TransactionList({ transactions }: TransactionListProps) {
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
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
