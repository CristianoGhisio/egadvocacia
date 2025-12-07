'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Edit, Trash, Calendar, Clock, FileText, Scale, User, Mail, Phone, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CaseForm } from '@/components/cases/case-form'
import { DeadlineList } from '@/components/cases/deadline-list'
import { HearingList } from '@/components/cases/hearing-list'
import { TaskKanban } from '@/components/cases/task-kanban'
import { DocumentList } from '@/components/documents/document-list'
import { ActivityTimeline } from '@/components/cases/activity-timeline'
import { DocumentUpload } from '@/components/documents/document-upload'
import { Client } from '@/lib/types/database'

interface Matter {
    id: string
    processNumber: string | null
    title: string
    description: string | null
    court: string | null
    district: string | null
    instance: string | null
    practiceArea: string
    status: string
    createdAt: string
    updatedAt: string
    client: Client
    responsibleLawyer?: {
        id: string
        fullName: string
        email: string
    }
    _count: {
        documents: number
        activities: number
        hearings: number
    }
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [matter, setMatter] = useState<Matter | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditOpen, setIsEditOpen] = useState(false)

    const fetchMatter = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/cases/${id}`)
            if (response.ok) {
                const data = await response.json()
                setMatter(data)
            } else {
                toast.error('Erro ao carregar processo')
                router.push('/dashboard/cases')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro de conexão')
        } finally {
            setIsLoading(false)
        }
    }, [id, router])

    useEffect(() => {
        fetchMatter()
    }, [fetchMatter])

    const handleEditSuccess = () => {
        setIsEditOpen(false)
        fetchMatter()
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja arquivar este processo?')) return

        try {
            const response = await fetch(`/api/cases/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast.success('Processo arquivado')
                router.push('/dashboard/cases')
            } else {
                toast.error('Erro ao arquivar')
            }
        } catch (error) {
            toast.error('Erro de conexão')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700'
            case 'pending': return 'bg-yellow-100 text-yellow-700'
            case 'closed': return 'bg-green-100 text-green-700'
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

    if (isLoading) {
        return <div className="flex justify-center p-8">Carregando detalhes...</div>
    }

    if (!matter) return null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild className="-ml-2">
                            <Link href="/dashboard/cases">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">{matter.title}</h1>
                        <Badge className={getStatusColor(matter.status)}>
                            {getStatusLabel(matter.status)}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground ml-9">
                        <Scale className="h-4 w-4" />
                        <span>Processo: {matter.processNumber || 'N/A'}</span>
                        <span>•</span>
                        <span>{matter.practiceArea}</span>
                    </div>
                </div>
                <div className="flex gap-2 ml-9 md:ml-0">
                    <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                    <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content (Left 2/3) */}
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList>
                            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                            <TabsTrigger value="activities">Atividades</TabsTrigger>
                            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
                            <TabsTrigger value="deadlines">Prazos</TabsTrigger>
                            <TabsTrigger value="hearings">Audiências</TabsTrigger>
                            <TabsTrigger value="documents">Documentos</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6 mt-6">
                            {/* Description Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalhes do Caso</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Tribunal</p>
                                            <p>{matter.court || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Comarca</p>
                                            <p>{matter.district || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Instância</p>
                                            <p>{matter.instance || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Data de Abertura</p>
                                            <p>{format(new Date(matter.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                                        </div>
                                    </div>

                                    {matter.description && (
                                        <div className="pt-4 border-t">
                                            <p className="text-sm font-medium text-muted-foreground mb-2">Descrição / Observações</p>
                                            <p className="text-sm whitespace-pre-wrap">{matter.description}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Client Info Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-lg font-medium">Cliente</CardTitle>
                                    <Link href={`/dashboard/crm/clients/${matter.client.id}`} className="text-sm text-blue-500 hover:underline flex items-center">
                                        Ver perfil <ExternalLink className="ml-1 h-3 w-3" />
                                    </Link>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{matter.client.name}</p>
                                            <p className="text-sm text-muted-foreground capitalize">{matter.client.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {matter.client.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span>{matter.client.email}</span>
                                            </div>
                                        )}
                                        {matter.client.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{matter.client.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="activities">
                            <Card>
                                <CardContent className="pt-6">
                                    <ActivityTimeline caseId={matter.id} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="tasks">
                            <Card>
                                <CardContent className="pt-6">
                                    <TaskKanban caseId={matter.id} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="deadlines">
                            <Card>
                                <CardContent className="pt-6">
                                    <DeadlineList caseId={matter.id} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="hearings">
                            <Card>
                                <CardContent className="pt-6">
                                    <HearingList caseId={matter.id} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="documents">
                            <Card>
                                <CardContent className="pt-6">
                                    <DocumentUpload matterId={matter.id} />
                                    <DocumentList matterId={matter.id} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar (Right 1/3) */}
                <div className="space-y-6">
                    {/* Responsável */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Responsável</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {matter.responsibleLawyer ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                                        {matter.responsibleLawyer.fullName.charAt(0)}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium">{matter.responsibleLawyer.fullName}</p>
                                        <p className="text-xs text-muted-foreground">{matter.responsibleLawyer.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Sem advogado atribuído</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Prazos Pendentes</span>
                                <Badge variant="secondary">0</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Audiências</span>
                                <Badge variant="secondary">{matter._count.hearings}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Documentos</span>
                                <Badge variant="secondary">{matter._count.documents}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Processo</DialogTitle>
                        <DialogDescription>
                            Atualize as informações do caso.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Pass initial data for editing - Needs careful mapping */}
                    <CaseForm
                        caseId={matter.id}
                        initialData={{
                            clientId: matter.client.id,
                            title: matter.title,
                            processNumber: matter.processNumber || '',
                            description: matter.description || '',
                            practiceArea: matter.practiceArea,
                            court: matter.court || '',
                            district: matter.district || '',
                            instance: matter.instance || '',
                            status: (['open','pending','closed','archived'].includes(matter.status) ? matter.status : 'open') as 'open' | 'pending' | 'closed' | 'archived',
                        }}
                        onSuccess={handleEditSuccess}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
