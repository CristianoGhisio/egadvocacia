'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import * as React from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
    onChanged?: () => void
}

export function InvoiceList({ invoices, onChanged }: InvoiceListProps) {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [currentInvoice, setCurrentInvoice] = React.useState<Invoice | null>(null)
    const [amount, setAmount] = React.useState<number>(0)
    const [method, setMethod] = React.useState<string>('Pix')
    const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)

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

    const openPayment = (invoice: Invoice) => {
        setCurrentInvoice(invoice)
        setAmount(invoice.totalAmount)
        setDate(new Date().toISOString().slice(0,10))
        setMethod('Pix')
        setIsDialogOpen(true)
    }

    const submitPayment = async () => {
        if (!currentInvoice) return
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/billing/invoices/${currentInvoice.id}/payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    paymentMethod: method,
                    paymentDate: date,
                })
            })
            if (!res.ok) throw new Error('Falha ao registrar pagamento')
            setIsDialogOpen(false)
            if (onChanged) onChanged()
        } catch (e) {
            toast.error('Falha ao registrar pagamento')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            const res = await fetch(`/api/billing/invoices/${deleteId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            setDeleteId(null)
            if (onChanged) onChanged()
            toast.success('Fatura excluída')
        } catch {
            toast.error('Erro ao excluir fatura')
        }
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
                                    <Button variant="ghost" size="sm" onClick={() => window.open(`/api/billing/invoices/${invoice.id}/pdf`, '_blank')}>
                                        Baixar PDF
                                    </Button>
                                    {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                        <Button size="sm" onClick={() => openPayment(invoice)}>
                                            Registrar Pagamento
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" title="Excluir Fatura" onClick={() => setDeleteId(invoice.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>

            {/* Dialog de Pagamento */}
            {isDialogOpen && (
                <div className="p-4 border-t">
                    <div className="max-w-xl space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Registrar pagamento para a fatura #{currentInvoice?.invoiceNumber}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="text-sm font-medium">Valor (R$)</label>
                                <input
                                    type="number"
                                    className="mt-1 w-full border rounded px-2 py-1"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="text-sm font-medium">Método</label>
                                <select
                                    className="mt-1 w-full border rounded px-2 py-1"
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value)}
                                >
                                    <option>Pix</option>
                                    <option>Boleto</option>
                                    <option>Cartão</option>
                                    <option>Transferência</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="text-sm font-medium">Data</label>
                                <input
                                    type="date"
                                    className="mt-1 w-full border rounded px-2 py-1"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={submitPayment} disabled={isSubmitting}>
                                {isSubmitting ? 'Registrando...' : 'Confirmar Pagamento'}
                            </Button>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {deleteId && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50" />
                    <dialog
                        open
                        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-md p-6 shadow-xl"
                    >
                        <div className="space-y-3">
                            <div className="text-lg font-semibold">Excluir Fatura</div>
                            <div className="text-sm text-muted-foreground">Esta ação é definitiva e não poderá ser desfeita.</div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button className="px-3 py-2 border rounded" onClick={() => setDeleteId(null)}>Cancelar</button>
                                <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>Excluir</button>
                            </div>
                        </div>
                    </dialog>
                </>
            )}
        </div>
    )
}
