'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface User {
    id: string
    fullName: string | null
    email: string
    role: string
    isActive: boolean
}

export default function UsersSettingsPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // Invite Form
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('lawyer')

    async function fetchUsers() {
        setIsLoading(true)
        try {
            const res = await fetch('/api/settings/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        try {
            const res = await fetch('/api/settings/users/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            })

            if (res.ok) {
                setIsInviteOpen(false)
                setInviteEmail('')
                fetchUsers()
            } else {
                alert('Erro ao convidar usuário')
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedUser) return
        try {
            const res = await fetch(`/api/settings/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedUser.role, isActive: selectedUser.isActive })
            })
            if (res.ok) {
                setIsEditOpen(false)
                setSelectedUser(null)
                fetchUsers()
            } else {
                alert('Erro ao atualizar usuário')
            }
        } catch {}
    }

    async function confirmDelete() {
        if (!selectedUser) return
        try {
            const res = await fetch(`/api/settings/users/${selectedUser.id}`, { method: 'DELETE' })
            if (res.ok) {
                setIsDeleteOpen(false)
                setSelectedUser(null)
                fetchUsers()
            } else {
                alert('Erro ao excluir usuário')
            }
        } catch {}
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
                    <p className="text-muted-foreground">
                        Controle quem tem acesso ao sistema e seus níveis de permissão.
                    </p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Convidar Usuário
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Convidar Novo Usuário</DialogTitle>
                            <DialogDescription>
                                Envie um convite por e-mail para um novo membro da equipe.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colega@escritorio.com"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role">Função / Papel</Label>
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                            <SelectItem value="lawyer">Advogado</SelectItem>
                                            <SelectItem value="paralegal">Estagiário/Paralegal</SelectItem>
                                            <SelectItem value="financial">Financeiro</SelectItem>
                                            <SelectItem value="secretary">Secretária</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Enviar Convite</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Usuários Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.fullName || 'Convidado'}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                            {user.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setIsEditOpen(true) }} title="Editar">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setIsDeleteOpen(true) }} title="Excluir">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        Nenhum usuário encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Usuário</DialogTitle>
                        <DialogDescription>Atualize as informações do usuário</DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Função / Papel</Label>
                                <Select value={selectedUser.role} onValueChange={(v) => setSelectedUser(prev => prev ? { ...prev, role: v } : prev)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="lawyer">Advogado</SelectItem>
                                        <SelectItem value="paralegal">Estagiário/Paralegal</SelectItem>
                                        <SelectItem value="financial">Financeiro</SelectItem>
                                        <SelectItem value="secretary">Secretária</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={selectedUser.isActive ? 'active' : 'inactive'} onValueChange={(v) => setSelectedUser(prev => prev ? { ...prev, isActive: v === 'active' } : prev)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Salvar</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Usuário</DialogTitle>
                        <DialogDescription>Esta ação é definitiva e não poderá ser desfeita.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
