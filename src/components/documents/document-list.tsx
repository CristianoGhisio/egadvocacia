'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { FileText, Download, Trash, File, Image as ImageIcon, Scale, Users, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'
import { DocumentEditDialog } from './document-edit-dialog'

interface Document {
    id: string
    name: string
    type: string | null
    fileSize: number | null
    createdAt: string
    storagePath: string
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

export function DocumentList({ matterId, clientId, excludeMatters }: { matterId?: string, clientId?: string, excludeMatters?: boolean }) {
    const [documents, setDocuments] = useState<Document[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [editingDoc, setEditingDoc] = useState<Document | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)

    const fetchDocuments = async () => {
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
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar documentos')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [matterId, clientId, excludeMatters])

    useEffect(() => {
        const handleRefresh = () => fetchDocuments()
        window.addEventListener('document-uploaded', handleRefresh)
        return () => window.removeEventListener('document-uploaded', handleRefresh)
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

    return (
        <div className="rounded-md border">
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
                                                setEditingDoc(doc)
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

            <DocumentEditDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                document={editingDoc}
                onSuccess={() => {
                    fetchDocuments()
                    setEditingDoc(null)
                }}
            />
        </div>
    )
}
