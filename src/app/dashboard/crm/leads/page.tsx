'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { LeadKanban } from '@/components/crm/lead-kanban'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ClientForm } from '@/components/crm/client-form'

export default function LeadsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    // Key to force refresh of kanban
    const [refreshKey, setRefreshKey] = useState(0)

    const handleCreateSuccess = () => {
        setIsDialogOpen(false)
        setRefreshKey(prev => prev + 1)
    }

    return (
        <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h1>
                    <p className="text-muted-foreground">
                        Gerencie seus leads e oportunidades de negócio
                    </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Lead
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                <LeadKanban key={refreshKey} />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Lead</DialogTitle>
                        <DialogDescription>
                            Cadastre um cliente potencial para iniciar o atendimento
                        </DialogDescription>
                    </DialogHeader>
                    {/* We pass initialData with status='lead' to default the form to Lead mode */}
                    <ClientForm
                        onSuccess={handleCreateSuccess}
                        onCancel={() => setIsDialogOpen(false)}
                        initialData={{ status: 'lead', leadStage: 'new' }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
