'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ClientForm } from '@/components/crm/client-form'
import { ContactForm } from '@/components/crm/contact-form'
import { InteractionForm } from '@/components/crm/interaction-form'
import { DocumentUpload } from '@/components/documents/document-upload'
import { DocumentList } from '@/components/documents/document-list'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Loader2, FileText, Users, MessageSquare, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { formatDocument, formatPhone, formatAddress } from '@/lib/utils'
import type { ClientView } from '@/lib/types/database'

type Client = ClientView

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap async params
    const { id } = use(params)
    const router = useRouter()
    const [client, setClient] = useState<Client | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const fetchClient = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/crm/clients/${id}`, {
                cache: 'no-store'
            })

            if (!response.ok) {
                throw new Error('Cliente não encontrado')
            }

            const data = await response.json()
            setClient(data)
        } catch (error) {
            console.error('Error fetching client:', error)
            toast.error('Erro ao carregar cliente')
            router.push('/dashboard/crm/clients')
        } finally {
            setIsLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        fetchClient()
    }, [fetchClient])

    const handleUpdateSuccess = () => {
        setIsEditDialogOpen(false)
        fetchClient()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!client) {
        return null
    }

    const statusColors = {
        lead: 'bg-yellow-100 text-yellow-800',
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        archived: 'bg-red-100 text-red-800',
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push('/dashboard/crm/clients')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                            <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                                {client.status}
                            </Badge>
                            <Badge variant="outline">
                                {client.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Cliente desde {new Date(client.createdAt || '').toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>
                <Button onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </Button>
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Processos</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{client._count.matters}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{client._count.contacts}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Interações</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{client._count.interactions}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Advogado Responsável</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">
                            {client.responsibleLawyer?.fullName || '-'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {client.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{client.email}</span>
                            </div>
                        )}
                        {client.phone && (
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{formatPhone(client.phone)}</span>
                            </div>
                        )}
                        {client.cpfCnpj && (
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDocument(client.cpfCnpj, client.type)}</span>
                            </div>
                        )}
                        {(client.street || client.city) && (
                            <div className="flex items-center gap-2 w-full">
                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="break-words max-w-full">
                                    {formatAddress(client)}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="processes" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="processes">Processos</TabsTrigger>
                    <TabsTrigger value="interactions">Interações</TabsTrigger>
                    <TabsTrigger value="contacts">Contatos</TabsTrigger>
                    <TabsTrigger value="documents">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="processes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Processos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {client.matters.length === 0 ? (
                                <p className="text-muted-foreground">Nenhum processo cadastrado</p>
                            ) : (
                                <div className="space-y-3">
                                    {client.matters.map((matter) => (
                                        <div key={matter.id} className="border-b pb-3 last:border-0">
                                            <p className="font-medium">{matter.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {matter.processNumber || 'Sem número de processo'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="interactions" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Histórico de Interações</CardTitle>
                            <InteractionForm
                                clientId={client.id}
                                onSuccess={fetchClient}
                            />
                        </CardHeader>
                        <CardContent>
                            {client.interactions.length === 0 ? (
                                <p className="text-muted-foreground">Nenhuma interação registrada</p>
                            ) : (
                                <div className="space-y-3">
                                    {client.interactions.map((interaction) => (
                                        <div key={interaction.id} className="border-b pb-3 last:border-0">
                                            <p className="font-medium">{interaction.subject}</p>
                                            <p className="text-sm text-muted-foreground">{interaction.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(interaction.createdAt).toLocaleString('pt-BR')} - {interaction.user?.fullName}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Contatos</CardTitle>
                            <ContactForm
                                clientId={client.id}
                                onSuccess={fetchClient}
                            />
                        </CardHeader>
                        <CardContent>
                            {client.contacts.length === 0 ? (
                                <p className="text-muted-foreground">Nenhum contato cadastrado</p>
                            ) : (
                                <div className="space-y-3">
                                    {client.contacts.map((contact) => (
                                        <div key={contact.id} className="border-b pb-3 last:border-0">
                                            <p className="font-medium">{contact.name}</p>
                                            {contact.role && <p className="text-sm text-muted-foreground">{contact.role}</p>}
                                            {contact.email && <p className="text-sm">{contact.email}</p>}
                                            {contact.phone && <p className="text-sm">{contact.phone}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DocumentUpload
                                clientId={client.id}
                            />
                            <div className="mt-8">
                                <DocumentList
                                    clientId={client.id}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                        <DialogDescription>
                            Atualize os dados do cliente abaixo
                        </DialogDescription>
                    </DialogHeader>
                    <ClientForm
                        clientId={client.id}
                        initialData={{
                            type: client.type,
                            name: client.name,
                            cpfCnpj: client.cpfCnpj || undefined,
                            email: client.email || '',
                            phone: client.phone || undefined,
                            street: client.street || undefined,
                            number: client.number || undefined,
                            complement: client.complement || undefined,
                            neighborhood: client.neighborhood || undefined,
                            city: client.city || undefined,
                            state: client.state || undefined,
                            zipCode: client.zipCode || undefined,
                            status: (['lead','active','inactive','archived'].includes(client.status) ? client.status : 'active') as 'lead' | 'active' | 'inactive' | 'archived',
                            leadStage: 'new'
                        }}
                        onSuccess={handleUpdateSuccess}
                        onCancel={() => setIsEditDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
