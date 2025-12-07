'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

export interface Invoice {
    id: string
    invoiceNumber: string
    issueDate: string
    dueDate: string
    totalAmount: number
    status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
    client: {
        name: string
    }
    _count?: {
        items: number
    }
}

interface InvoiceListProps {
    invoices: Invoice[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'default' // primary
            case 'pending': return 'secondary' // gray
            case 'overdue': return 'destructive' // red
            case 'draft': return 'outline'
            default: return 'secondary'
        }
    }

    const translateStatus = (status: string) => {
        const map: Record<string, string> = {
            paid: 'Pago',
            pending: 'Pendente',
            overdue: 'Atrasado',
            draft: 'Rascunho',
            cancelled: 'Cancelado'
        }
        return map[status] || status
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nº</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Emissão</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                Nenhuma fatura encontrada.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">#{invoice.invoiceNumber}</TableCell>
                                <TableCell>{invoice.client.name}</TableCell>
                                <TableCell>{format(new Date(invoice.issueDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{format(new Date(invoice.dueDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusColor(invoice.status) as "default" | "secondary" | "destructive" | "outline"}>
                                        {translateStatus(invoice.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(invoice.totalAmount)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" title="Ver Detalhes">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
