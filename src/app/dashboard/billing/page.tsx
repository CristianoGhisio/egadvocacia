'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InvoiceList, Invoice } from '@/components/billing/invoice-list'
import Link from 'next/link'

export default function BillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const fetchInvoices = useCallback(async () => {
        try {
            const params = new URLSearchParams()
            if (filterStatus !== 'all') params.append('status', filterStatus)

            const res = await fetch(`/api/billing/invoices?${params.toString()}`)
            const data = await res.json()
            setInvoices(data)
        } catch (error) {
            console.error("Failed to fetch invoices", error)
        } finally {
            setIsLoading(false)
        }
    }, [filterStatus])

    useEffect(() => {
        fetchInvoices()
    }, [fetchInvoices])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Faturamento</h2>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/dashboard/billing/new">
                            <Plus className="mr-2 h-4 w-4" /> Nova Fatura
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center space-x-2">
                    <Input
                        placeholder="Buscar faturas..."
                        className="h-8 w-[150px] lg:w-[250px]"
                    />
                    {/* Add Status Filter Dropdown here if needed */}
                </div>
            </div>

            {isLoading ? (
                <div>Carregando...</div>
            ) : (
                <InvoiceList invoices={invoices} onChanged={fetchInvoices} />
            )}
        </div>
    )
}
