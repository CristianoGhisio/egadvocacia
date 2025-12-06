'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DocumentUpload } from '@/components/documents/document-upload'
import { DocumentList } from '@/components/documents/document-list'
import { FileText } from 'lucide-react'

export default function DocumentsPage() {
    const [totalFiles, setTotalFiles] = useState<number | null>(null)

    useEffect(() => {
        fetch('/api/documents')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTotalFiles(data.length)
                }
            })
            .catch(err => console.error('Failed to fetch stats', err))

        // Listen for uploads to update count
        const handleRefresh = () => {
            fetch('/api/documents')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setTotalFiles(data.length)
                    }
                })
        }
        window.addEventListener('document-uploaded', handleRefresh)
        return () => window.removeEventListener('document-uploaded', handleRefresh)
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Gestão de Documentos (GED)</h1>
                <p className="text-muted-foreground">
                    Gerencie todos os arquivos do escritório, contratos e peças jurídicas.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                {/* Stats Cards */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Arquivos</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalFiles !== null ? totalFiles : '-'}</div>
                        <p className="text-xs text-muted-foreground">
                            No sistema
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload de Arquivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DocumentUpload />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Todos os Documentos</CardTitle>
                        <CardDescription>
                            Listagem completa de arquivos armazenados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DocumentList />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
