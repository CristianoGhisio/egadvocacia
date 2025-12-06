'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const caseFormSchema = z.object({
    clientId: z.string({ required_error: 'Selecione um cliente' }).min(1, 'Selecione um cliente'),
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    processNumber: z.string().optional(),
    description: z.string().optional(),
    practiceArea: z.string().min(1, 'Área de prática é obrigatória'),
    court: z.string().optional(),
    district: z.string().optional(),
    instance: z.string().optional(),
    status: z.enum(['open', 'pending', 'closed', 'archived']).default('open'),
})

type CaseFormData = z.infer<typeof caseFormSchema>

interface CaseFormProps {
    initialData?: any
    caseId?: string
    onSuccess?: () => void
    onCancel?: () => void
}

export function CaseForm({ initialData, caseId, onSuccess, onCancel }: CaseFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [isLoadingClients, setIsLoadingClients] = useState(false)
    const [openClientSelect, setOpenClientSelect] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CaseFormData>({
        resolver: zodResolver(caseFormSchema),
        defaultValues: initialData || {
            status: 'open',
            practiceArea: 'Cível', // Default
        },
    })

    const selectedClientId = watch('clientId')

    // Fetch clients for autocomplete
    useEffect(() => {
        const fetchClients = async () => {
            setIsLoadingClients(true)
            try {
                const response = await fetch('/api/crm/clients?status=active')
                if (response.ok) {
                    const data = await response.json()
                    setClients(data)
                }
            } catch (error) {
                console.error('Failed to fetch clients', error)
            } finally {
                setIsLoadingClients(false)
            }
        }
        fetchClients()
    }, [])

    const onSubmit = async (data: CaseFormData) => {
        setIsLoading(true)
        try {
            const url = caseId
                ? `/api/cases/${caseId}`
                : '/api/cases'

            const method = caseId ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro ao salvar processo')
            }

            toast.success(caseId ? 'Processo atualizado!' : 'Processo criado!')
            onSuccess?.()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro desconhecido')
        } finally {
            setIsLoading(false)
        }
    }

    // Common practice areas
    const practiceAreas = [
        'Cível',
        'Trabalhista',
        'Criminal',
        'Família e Sucessões',
        'Tributário',
        'Previdenciário',
        'Administrativo',
        'Empresarial',
        'Consumidor',
        'Imobiliário',
        'Outro'
    ]

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
                {/* Cliente Selection (Combobox) */}
                <div className="space-y-2">
                    <Label>Cliente *</Label>
                    <Popover open={openClientSelect} onOpenChange={setOpenClientSelect}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openClientSelect}
                                className="w-full justify-between"
                                disabled={isLoading}
                            >
                                {selectedClientId
                                    ? clients.find((client) => client.id === selectedClientId)?.name || 'Cliente selecionado'
                                    : "Selecione um cliente..."}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                            <Command>
                                <CommandInput placeholder="Buscar cliente..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        {clients.map((client) => (
                                            <CommandItem
                                                key={client.id}
                                                value={client.name}
                                                onSelect={() => {
                                                    setValue('clientId', client.id)
                                                    setOpenClientSelect(false)
                                                }}
                                            >
                                                {client.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {errors.clientId && (
                        <p className="text-sm text-red-600">{errors.clientId.message}</p>
                    )}
                </div>

                {/* Título e Nº Processo */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título do Caso *</Label>
                        <Input
                            id="title"
                            {...register('title')}
                            placeholder="Ex: Ação de Cobrança vs Empresa X"
                            disabled={isLoading}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-600">{errors.title.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="processNumber">Número do Processo</Label>
                        <Input
                            id="processNumber"
                            {...register('processNumber')}
                            placeholder="0000000-00.0000.0.00.0000"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Área e Status */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="practiceArea">Área de Prática *</Label>
                        <Select
                            value={watch('practiceArea')}
                            onValueChange={(val) => setValue('practiceArea', val)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {practiceAreas.map(area => (
                                    <SelectItem key={area} value={area}>{area}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.practiceArea && (
                            <p className="text-sm text-red-600">{errors.practiceArea.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={watch('status')}
                            onValueChange={(val: any) => setValue('status', val)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Em Aberto</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="closed">Encerrado</SelectItem>
                                <SelectItem value="archived">Arquivado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Detalhes do Juízo */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="court">Tribunal</Label>
                        <Input
                            id="court"
                            {...register('court')}
                            placeholder="Ex: TJSP"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="district">Comarca</Label>
                        <Input
                            id="district"
                            {...register('district')}
                            placeholder="Ex: São Paulo"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="instance">Instância</Label>
                        <Select
                            value={watch('instance') || ''}
                            onValueChange={(val) => setValue('instance', val)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1ª Instância</SelectItem>
                                <SelectItem value="2">2ª Instância (Tribunal)</SelectItem>
                                <SelectItem value="STJ">STJ</SelectItem>
                                <SelectItem value="STF">STF</SelectItem>
                                <SelectItem value="Adm">Administrativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição / Notas Iniciais</Label>
                    <Textarea
                        id="description"
                        {...register('description')}
                        placeholder="Detalhes adicionais sobre o caso..."
                        className="min-h-[100px]"
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {caseId ? 'Salvar Alterações' : 'Criar Processo'}
                </Button>
            </div>
        </form>
    )
}
