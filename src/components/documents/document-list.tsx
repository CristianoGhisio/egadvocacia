'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Download, Trash, File, Image as ImageIcon, Scale, Users, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
 
import { DocumentEditDialog } from './document-edit-dialog'

interface Document {
    id: string
    name: string
    type: string | null
    fileSize: number | null
    createdAt: string
    storagePath: string
    version?: number
    uploadedBy: {
        fullName: string
    } | null
    matter?: {
        id: string
        title: string
    } | null
    client?: {
        id: string
        name: string
    } | null
}

interface TemplateItem {
    id: string
    name: string
    variables?: string
}

interface DocumentVersionItem {
    id: string
    version: number
    storagePath: string
    fileSize?: number
    createdAt: string
    changesDescription?: string | null
}

export function DocumentList({ matterId, clientId, excludeMatters }: { matterId?: string, clientId?: string, excludeMatters?: boolean }) {
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(false)
    interface EditableDocumentLike {
        id: string
        client?: { id: string; name?: string; cpfCnpj?: string }
        matter?: { id: string; title?: string; client?: { id: string; name?: string } }
    }
    const [editingDoc, setEditingDoc] = useState<EditableDocumentLike | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [templates, setTemplates] = useState<TemplateItem[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
    const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
    const [templateLoading, setTemplateLoading] = useState(false)
    const [expandedVersions, setExpandedVersions] = useState<Record<string, DocumentVersionItem[]>>({})
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)

    const fetchDocuments = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (matterId) params.append('matterId', matterId)
            if (clientId) params.append('clientId', clientId)
            if (excludeMatters) params.append('excludeMatters', 'true')

            const res = await fetch(`/api/documents?${params.toString()}`)
            if (res.ok) {
                setDocuments(await res.json())
            }
        } catch {
            console.error('Erro ao carregar documentos')
            toast.error('Erro ao carregar documentos')
        } finally {
            setIsLoading(false)
        }
    }, [matterId, clientId, excludeMatters])

    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    useEffect(() => {
        const handleRefresh = () => fetchDocuments()
        window.addEventListener('document-uploaded', handleRefresh)
        return () => window.removeEventListener('document-uploaded', handleRefresh)
    }, [fetchDocuments])

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const res = await fetch('/api/documents/templates')
                if (res.ok) {
                    const data = await res.json()
                    setTemplates(data as TemplateItem[])
                }
            } catch {}
        }
        loadTemplates()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este arquivo permanentemente?')) return

        try {
            const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success('Arquivo excluído')
                setDocuments(prev => prev.filter(d => d.id !== id))
            } else {
                throw new Error()
            }
        } catch (error) {
            toast.error('Erro ao excluir')
        }
    }

    const getFileIcon = (mimeType: string | undefined, name: string) => {
        const ext = name.split('.').pop()?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <ImageIcon className="h-4 w-4 text-blue-500" />
        if (ext === 'pdf') return <FileText className="h-4 w-4 text-red-500" />
        return <File className="h-4 w-4 text-slate-500" />
    }

    const formatSize = (bytes: number | null) => {
        if (!bytes) return '-'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleGenerateFromTemplate = async () => {
        if (!selectedTemplateId) {
            toast.error('Selecione um template')
            return
        }
        setTemplateLoading(true)
        try {
            const res = await fetch(`/api/documents/templates/${selectedTemplateId}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matterId: matterId || undefined,
                    clientId: clientId || undefined,
                    variables: templateVariables,
                })
            })
            if (res.ok) {
                toast.success('Documento gerado')
                setSelectedTemplateId('')
                setTemplateVariables({})
                fetchDocuments()
            } else {
                toast.error('Falha ao gerar documento')
            }
        } catch {
            toast.error('Erro ao gerar documento')
        } finally {
            setTemplateLoading(false)
        }
    }

    const handleUploadVersionClick = (docId: string) => {
        setUploadingDocId(docId)
        fileInputRef.current?.click()
    }

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !uploadingDocId) return
        const desc = window.prompt('Descrição das alterações da versão:') || ''
        const form = new FormData()
        form.append('file', file)
        if (desc) form.append('changesDescription', desc)
        try {
            const res = await fetch(`/api/documents/${uploadingDocId}/versions`, { method: 'POST', body: form })
            if (res.ok) {
                toast.success('Nova versão criada')
                fetchDocuments()
            } else {
                toast.error('Falha ao criar versão')
            }
        } catch {
            toast.error('Erro ao criar versão')
        } finally {
            setUploadingDocId(null)
        }
    }

    const toggleVersions = async (docId: string) => {
        if (expandedVersions[docId]) {
            const copy = { ...expandedVersions }
            delete copy[docId]
            setExpandedVersions(copy)
            return
        }
        try {
            const res = await fetch(`/api/documents/${docId}/versions`)
            if (res.ok) {
                const data = await res.json() as DocumentVersionItem[]
                setExpandedVersions(prev => ({ ...prev, [docId]: data }))
            }
        } catch {}
    }

    return (
        <div className="rounded-md border">
            {(matterId || clientId) && (
                <div className="p-4 border-b space-y-3">
                    <div className="text-sm font-medium">Gerar Documento a partir de Template</div>
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div>
                            <Label>Template</Label>
                            <Select value={selectedTemplateId} onValueChange={(v) => setSelectedTemplateId(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            {(() => {
                                const tpl = templates.find((t) => t.id === selectedTemplateId)
                                let vars: string[] = []
                                try { vars = tpl ? JSON.parse(tpl.variables || '[]') : [] } catch { vars = [] }
                                return (
                                    <div className="grid grid-cols-2 gap-3">
                                        {vars.map((v) => (
                                            <div key={v}>
                                                <Label>{v}</Label>
                                                <Input value={templateVariables[v] || ''} onChange={(e) => setTemplateVariables(prev => ({ ...prev, [v]: e.target.value }))} />
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleGenerateFromTemplate} disabled={templateLoading || !selectedTemplateId}>Gerar Documento</Button>
                    </div>
                </div>
            )}

            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Vínculo</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Enviado Por</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                {isLoading ? 'Carregando...' : 'Nenhum documento encontrado.'}
                            </TableCell>
                        </TableRow>
                    ) : (
                        documents.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell>
                                    {getFileIcon(undefined, doc.name)}
                                </TableCell>
                                <TableCell className="font-medium">
                                    <a
                                        href={doc.storagePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline hover:text-blue-600"
                                    >
                                        {doc.name}
                                    </a>
                                    {typeof doc.version === 'number' && (
                                        <span className="ml-2 text-xs text-muted-foreground">v{doc.version}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {doc.matter && (
                                        <div className="flex items-center gap-1 text-xs bg-slate-100 px-2 py-1 rounded w-fit">
                                            <Scale className="h-3 w-3" />
                                            <span className="truncate max-w-[150px]" title={doc.matter.title}>{doc.matter.title}</span>
                                        </div>
                                    )}
                                    {doc.client && (
                                        <div className="flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded w-fit mt-1">
                                            <Users className="h-3 w-3" />
                                            <span>{doc.client.name}</span>
                                        </div>
                                    )}
                                    {!doc.matter && !doc.client && <span className="text-muted-foreground text-xs">-</span>}
                                </TableCell>
                                <TableCell>{formatSize(doc.fileSize)}</TableCell>
                                <TableCell>{doc.uploadedBy?.fullName || '-'}</TableCell>
                                <TableCell>{format(new Date(doc.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const mapped: EditableDocumentLike = {
                                                    id: doc.id,
                                                    client: doc.client ? { id: doc.client.id, name: doc.client.name } : undefined,
                                                    matter: doc.matter ? { id: doc.matter.id, title: doc.matter.title } : undefined,
                                                }
                                                setEditingDoc(mapped)
                                                setIsEditOpen(true)
                                            }}
                                        >
                                            <Pencil className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={doc.storagePath} download target="_blank">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleUploadVersionClick(doc.id)} title="Nova Versão">
                                            <FileText className="h-4 w-4 text-purple-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => toggleVersions(doc.id)} title="Ver versões">
                                            <File className="h-4 w-4 text-slate-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                                            <Trash className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {documents.map((doc) => (
                expandedVersions[doc.id] && (
                    <div key={`versions-${doc.id}`} className="px-4 py-3 border-t bg-slate-50">
                        <div className="text-sm font-medium">Versões de {doc.name}</div>
                        <div className="mt-2">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Versão</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expandedVersions[doc.id].length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma versão</TableCell>
                                        </TableRow>
                                    ) : (
                                        expandedVersions[doc.id].map((v: DocumentVersionItem) => (
                                            <TableRow key={v.id}>
                                                <TableCell>v{v.version}</TableCell>
                                                <TableCell>{format(new Date(v.createdAt), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{v.changesDescription || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={v.storagePath} download target="_blank">Baixar</a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )
            ))}

            {editingDoc && (
                <DocumentEditDialog
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    document={editingDoc}
                    onSuccess={() => {
                        fetchDocuments()
                        setEditingDoc(null)
                    }}
                />
            )}
        </div>
    )
}
