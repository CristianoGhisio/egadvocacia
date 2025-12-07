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
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

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

            const response = await fetch(`/api/crm/clients?${params.toString()}`)

            if (!response.ok) {
                throw new Error('Erro ao carregar clientes')
            }

            const data = await response.json()
            setClients(data)
        } catch (error) {
            console.error('Error fetching clients:', error)
            toast.error('Erro ao carregar clientes')
        } finally {
            setIsLoading(false)
        }
    }, [statusFilter, typeFilter, searchTerm])

    useEffect(() => {
        fetchClients()
    }, [fetchClients])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
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
                                                onClick={() => {
                                                    const dlg = document.getElementById('client-delete-'+client.id) as HTMLDialogElement | null
                                                    dlg?.showModal?.()
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                        <dialog id={`client-delete-${client.id}`} className="rounded-md p-6">
                                            <div className="space-y-3">
                                                <div className="text-lg font-semibold">Excluir Cliente</div>
                                                <div className="text-sm text-muted-foreground">Esta ação não poderá ser desfeita.</div>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <button className="px-3 py-2 border rounded" onClick={(e) => (e.currentTarget.closest('dialog') as HTMLDialogElement).close()}>Cancelar</button>
                                                    <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={async (e) => {
                                                        try {
                                                            const res = await fetch(`/api/crm/clients/${client.id}`, { method: 'DELETE' })
                                                            if (!res.ok) return
                                                            (e.currentTarget.closest('dialog') as HTMLDialogElement).close()
                                                            fetchClients()
                                                        } catch {}
                                                    }}>Excluir</button>
                                                </div>
                                            </div>
                                        </dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

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
        </div>
    )
}
