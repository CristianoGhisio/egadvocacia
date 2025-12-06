'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Phone, Mail, Clock, ArrowRight } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'

interface Lead {
    id: string
    name: string
    email?: string
    phone?: string
    leadStage?: string
    updatedAt: string
    responsibleLawyer?: {
        fullName: string
    }
}

interface KanbanColumnProps {
    title: string
    stage: string
    leads: Lead[]
    onMoveLead: (leadId: string, newStage: string) => void
}

function KanbanColumn({ title, stage, leads, onMoveLead }: KanbanColumnProps) {
    return (
        <div className="flex-1 min-w-[300px] bg-slate-50/50 rounded-lg p-4 border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">{title}</h3>
                <Badge variant="secondary">{leads.length}</Badge>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto min-h-[200px]">
                {leads.map((lead) => (
                    <Card key={lead.id} className="cursor-move hover:shadow-md transition-shadow">
                        <CardHeader className="p-3 pb-0 space-y-0">
                            <div className="flex items-start justify-between">
                                <Link href={`/dashboard/crm/clients/${lead.id}`} className="hover:underline">
                                    <h4 className="font-medium text-sm line-clamp-1">{lead.name}</h4>
                                </Link>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onMoveLead(lead.id, 'new')}>
                                            Mover para Novo
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onMoveLead(lead.id, 'qualified')}>
                                            Mover para Qualificado
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onMoveLead(lead.id, 'proposal')}>
                                            Mover para Proposta
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onMoveLead(lead.id, 'negotiation')}>
                                            Mover para Negociação
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onMoveLead(lead.id, 'won')} className="text-green-600">
                                            Marcar como Ganho
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onMoveLead(lead.id, 'lost')} className="text-red-600">
                                            Marcar como Perdido
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 space-y-2">
                            {lead.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{lead.phone}</span>
                                </div>
                            )}
                            {lead.email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[180px]">{lead.email}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t mt-2">
                                <Clock className="h-3 w-3" />
                                <span>
                                    {formatDistanceToNow(new Date(lead.updatedAt), {
                                        addSuffix: true,
                                        locale: ptBR,
                                    })}
                                </span>
                            </div>
                            {stage !== 'won' && stage !== 'lost' && (
                                <div className="flex justify-end pt-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => {
                                            const nextStage =
                                                stage === 'new' ? 'qualified' :
                                                    stage === 'qualified' ? 'proposal' :
                                                        stage === 'proposal' ? 'negotiation' : 'won';
                                            onMoveLead(lead.id, nextStage);
                                        }}
                                    >
                                        Avançar <ArrowRight className="ml-1 h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export function LeadKanban() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchLeads = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/crm/clients?status=lead')
            if (!response.ok) throw new Error('Falha ao carregar leads')
            const data = await response.json()
            setLeads(data)
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar leads')
        } finally {
            setIsLoading(false)
        }
    }

    const moveLead = async (leadId: string, newStage: string) => {
        try {
            // Optimistic update
            setLeads(prev => prev.map(lead =>
                lead.id === leadId
                    ? { ...lead, leadStage: newStage, status: newStage === 'won' ? 'active' : 'lead' }
                    : lead
            ))

            // Se moveu para 'won', tecnicamente virou active client, mas vamos manter no kanban por um momento ou remover?
            // A API vai atualizar. Se mudar para 'active', ele sai da lista de leads no proximo fetch.
            // Vamos assumir que 'won' mantem como leadStage='won' mas status='active' para fins de registro, ou apenas atualiza stage.

            // Decisão: Se for 'won', mudamos status para 'active'. 
            const isWon = newStage === 'won';

            const response = await fetch(`/api/crm/clients/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadStage: newStage,
                    status: isWon ? 'active' : (newStage === 'lost' ? 'archived' : 'lead')
                }),
            })

            if (!response.ok) throw new Error('Erro ao mover lead')

            if (isWon) {
                toast.success('Lead convertido em Cliente Ativo!')
                // Remove from board after delay
                setTimeout(() => {
                    setLeads(prev => prev.filter(l => l.id !== leadId))
                }, 1000)
            } else if (newStage === 'lost') {
                toast.success('Lead arquivado como Perdido')
            }

        } catch (error) {
            toast.error('Erro ao atualizar estágio')
            fetchLeads() // Revert on error
        }
    }

    useEffect(() => {
        fetchLeads()
    }, [])

    const stages = [
        { id: 'new', title: 'Novos' },
        { id: 'qualified', title: 'Qualificados' },
        { id: 'proposal', title: 'Proposta Enviada' },
        { id: 'negotiation', title: 'Em Negociação' },
    ]

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Carregando pipeline...</div>
    }

    return (
        <div className="h-full overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1200px]">
                {stages.map(stage => (
                    <KanbanColumn
                        key={stage.id}
                        title={stage.title}
                        stage={stage.id}
                        leads={leads.filter(l => (l.leadStage || 'new') === stage.id)}
                        onMoveLead={moveLead}
                    />
                ))}
            </div>
        </div>
    )
}
