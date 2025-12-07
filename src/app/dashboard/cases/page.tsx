'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Scale, FileText, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CaseForm } from '@/components/cases/case-form'

interface Case {
    id: string
    processNumber: string | null
    title: string
    practiceArea: string
    status: string
    updatedAt: string
    client: { name: string }
    responsibleLawyer?: { fullName: string }
}

export default function CasesPage() {
    const [cases, setCases] = useState<Case[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    const fetchCases = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (searchTerm) params.append('search', searchTerm)

            const response = await fetch(`/api/cases?${params}`)
            if (response.ok) {
                const data = await response.json()
                setCases(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [searchTerm])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCases()
        }, 300)
        return () => clearTimeout(timer)
    }, [fetchCases])

    const handleCreateSuccess = () => {
        setIsCreateOpen(false)
        fetchCases()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
            case 'pending': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
            case 'closed': return 'bg-green-100 text-green-700 hover:bg-green-100'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'Em Aberto'
            case 'pending': return 'Pendente'
            case 'closed': return 'Encerrado'
            case 'archived': return 'Arquivado'
            default: return status
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Processos</h1>
                    <p className="text-muted-foreground">
                        Gerencie todos os seus casos e processos jurídicos
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Processo
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título, número ou cliente..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título / Número</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Área</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Última Atualização</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Carregando processos...
                                </TableCell>
                            </TableRow>
                        ) : cases.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Nenhum processo encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            cases.map((matter) => (
                                <TableRow key={matter.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{matter.title}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {matter.processNumber || 'Sem número'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{matter.client.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{matter.practiceArea}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(matter.status)}>
                                            {getStatusLabel(matter.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDistanceToNow(new Date(matter.updatedAt), {
                                            addSuffix: true,
                                            locale: ptBR,
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/dashboard/cases/${matter.id}`} title="Ver">
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="sm" title="Excluir" onClick={() => {
                                                const dlg = document.getElementById('case-delete-'+matter.id) as HTMLDialogElement | null
                                                dlg?.showModal?.()
                                            }}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                            <dialog id={`case-delete-${matter.id}`} className="rounded-md p-6">
                                                <div className="space-y-3">
                                                    <div className="text-lg font-semibold">Excluir Processo</div>
                                                    <div className="text-sm text-muted-foreground">Esta ação é definitiva e não poderá ser desfeita.</div>
                                                    <div className="flex justify-end gap-2 mt-4">
                                                        <button className="px-3 py-2 border rounded" onClick={(e) => (e.currentTarget.closest('dialog') as HTMLDialogElement).close()}>Cancelar</button>
                                                        <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={async (e) => {
                                                            try {
                                                                const res = await fetch(`/api/cases/${matter.id}`, { method: 'DELETE' })
                                                                if (!res.ok) return
                                                                (e.currentTarget.closest('dialog') as HTMLDialogElement).close()
                                                                fetchCases()
                                                            } catch {}
                                                        }}>Excluir</button>
                                                    </div>
                                                </div>
                                            </dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Processo</DialogTitle>
                        <DialogDescription>
                            Cadastre um novo caso jurídico para um cliente existente.
                        </DialogDescription>
                    </DialogHeader>
                    <CaseForm
                        onSuccess={handleCreateSuccess}
                        onCancel={() => setIsCreateOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
