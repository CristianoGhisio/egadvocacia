'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import { ClientForm } from '@/components/crm/client-form'
import { formatDocument } from '@/lib/utils'
import { Plus, Search, Eye, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { fetchJson, type PaginatedResponse } from '@/lib/api-client'

interface Client {
    id: string
    type: 'pf' | 'pj'
    name: string
    cpfCnpj?: string
    email?: string
    phone?: string
    status: 'lead' | 'active' | 'inactive' | 'archived'
    responsibleLawyer?: {
        id: string
        fullName: string
    }
    // Address fields (not displayed but returned)
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
    _count: {
        matters: number
        contacts: number
    }
    createdAt: string
}

const statusLabels = {
    lead: 'Lead',
    active: 'Ativo',
    inactive: 'Inativo',
    archived: 'Arquivado',
}

const statusColors = {
    lead: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    archived: 'bg-red-100 text-red-800',
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(1)
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const fetchClients = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()

            if (statusFilter !== 'all') {
                params.append('status', statusFilter)
            }
            if (typeFilter !== 'all') {
                params.append('type', typeFilter)
            }
            if (searchTerm) {
                params.append('search', searchTerm)
            }

            params.append('page', String(page))

            const data = await fetchJson<PaginatedResponse<Client>>(`/api/crm/clients?${params.toString()}`)
            setClients(data.data)
            setPage(data.pagination.page)
            setPageCount(data.pagination.pageCount)
        } catch (error) {
            console.error('Error fetching clients:', error)
            toast.error('Erro ao carregar clientes')
        } finally {
            setIsLoading(false)
        }
    }, [statusFilter, typeFilter, searchTerm, page])

    useEffect(() => {
        fetchClients()
    }, [fetchClients])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        fetchClients()
    }

    const handleCreateSuccess = () => {
        setIsDialogOpen(false)
        fetchClients()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gerencie seus clientes e leads
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar por nome, email ou CPF/CNPJ..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </form>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="pf">Pessoa Física</SelectItem>
                        <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="lead">Leads</SelectItem>
                        <SelectItem value="active">Ativos</SelectItem>
                        <SelectItem value="inactive">Inativos</SelectItem>
                        <SelectItem value="archived">Arquivados</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : clients.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                        Nenhum cliente encontrado
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>CPF/CNPJ</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Processos</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Advogado Responsável</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        {client.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {client.type === 'pf' ? 'PF' : 'PJ'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDocument(client.cpfCnpj, client.type)}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {client.email || '-'}
                                    </TableCell>
                                    <TableCell>{client._count.matters}</TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[client.status]}>
                                            {statusLabels[client.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {client.responsibleLawyer?.fullName || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/dashboard/crm/clients/${client.id}`}>
                                                <Button variant="ghost" size="sm" title={`Ver detalhes de ${client.name}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Excluir cliente"
                                                onClick={() => setDeleteId(client.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {clients.length > 0 && (
                <div className="flex items-center justify-end gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1 || isLoading}
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
                        disabled={page >= pageCount || isLoading}
                        onClick={() => setPage((current) => (current < pageCount ? current + 1 : current))}
                    >
                        Próxima
                    </Button>
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Cliente</DialogTitle>
                        <DialogDescription>
                            Preencha os dados do cliente abaixo
                        </DialogDescription>
                    </DialogHeader>
                    <ClientForm
                        onSuccess={handleCreateSuccess}
                        onCancel={() => setIsDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {deleteId && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/50" />
                    <dialog
                        open
                        className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-md p-6 shadow-xl"
                    >
                        <div className="space-y-3">
                            <div className="text-lg font-semibold">Excluir Cliente</div>
                            <div className="text-sm text-muted-foreground">Esta ação não poderá ser desfeita.</div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    className="px-3 py-2 border rounded"
                                    onClick={() => setDeleteId(null)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="px-3 py-2 bg-red-600 text-white rounded"
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`/api/crm/clients/${deleteId}`, { method: 'DELETE' })
                                            if (!res.ok) return
                                            setDeleteId(null)
                                            fetchClients()
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
