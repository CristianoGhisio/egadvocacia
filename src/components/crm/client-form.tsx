'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { formatCPF, formatCNPJ, formatPhone, formatCEP } from '@/lib/utils'

const clientFormSchema = z.object({
    type: z.enum(['pf', 'pj'] as const, {
        message: 'Selecione o tipo de cliente',
    }),
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    cpfCnpj: z.string().optional(),
    email: z.string().email('Email inválido').or(z.literal('')).optional(),
    phone: z.string().optional(),

    // Address
    zipCode: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),

    status: z.enum(['lead', 'active', 'inactive', 'archived'] as const),
    leadStage: z.enum(['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const).optional(),
})

type ClientFormData = z.infer<typeof clientFormSchema>

interface ClientFormProps {
    initialData?: any
    clientId?: string
    onSuccess?: () => void
    onCancel?: () => void
}

export function ClientForm({ initialData, clientId, onSuccess, onCancel }: ClientFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingCEP, setIsLoadingCEP] = useState(false)

    // Parse legacy JSON address if needed, or use new fields
    const parseInitialData = () => {
        if (!initialData) {
            return { type: 'pf', status: 'active' }
        }

        let parsedData = { ...initialData }

        // Handle potentially parsing old address JSON if we were migrating, 
        // but since we updated schema, we expect new fields mostly. 
        // If initialData.address was string JSON: 
        if (initialData.address && typeof initialData.address === 'string' && initialData.address.startsWith('{')) {
            try {
                const addr = JSON.parse(initialData.address)
                parsedData = {
                    ...parsedData,
                    street: addr.street || '',
                    city: addr.city || '',
                    state: addr.state || '',
                    zipCode: addr.zipCode || '',
                    // Old structure didn't have number/complement separately typically in that JSON
                }
            } catch (e) {
                // If not JSON, use as street
                parsedData.street = initialData.address
            }
        }

        // If we already have explicit fields (after migration/save), they take precedence
        if (initialData.street) parsedData.street = initialData.street
        if (initialData.number) parsedData.number = initialData.number
        if (initialData.complement) parsedData.complement = initialData.complement
        if (initialData.neighborhood) parsedData.neighborhood = initialData.neighborhood
        if (initialData.city) parsedData.city = initialData.city
        if (initialData.state) parsedData.state = initialData.state
        if (initialData.zipCode) parsedData.zipCode = initialData.zipCode

        return {
            ...parsedData,
            ...parsedData,
            status: parsedData.status || 'active',
            leadStage: parsedData.leadStage || 'new',
        }
    }

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientFormSchema),
        defaultValues: parseInitialData(),
    })

    const clientType = watch('type')
    const zipCode = watch('zipCode')

    // Buscar endereço pelo CEP
    const fetchAddress = async (cep: string) => {
        const cleanCEP = cep.replace(/\D/g, '')
        if (cleanCEP.length !== 8) return

        setIsLoadingCEP(true)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
            const data = await response.json()

            if (!data.erro) {
                setValue('street', data.logradouro || '')
                setValue('neighborhood', data.bairro || '')
                setValue('city', data.localidade || '')
                setValue('state', data.uf || '')
                // Nota: Não limpamos número nem complemento para preservar dados se o usuário editar apenas o CEP e voltar
                toast.success('Endereço encontrado!')
            } else {
                toast.error('CEP não encontrado')
            }
        } catch (error) {
            toast.error('Erro ao buscar CEP')
        } finally {
            setIsLoadingCEP(false)
        }
    }

    // Watch CEP changes
    useEffect(() => {
        const currentCep = zipCode?.replace(/\D/g, '')
        const initialCep = (initialData?.zipCode || '').replace(/\D/g, '')

        // Só busca se tiver 8 dígitos 
        // E (não tiver dados iniciais OU o CEP for diferente do inicial)
        // Isso evita buscar ao abrir o form de edição com dados existentes
        if (currentCep?.length === 8 && currentCep !== initialCep) {
            fetchAddress(currentCep)
        }
    }, [zipCode, initialData])

    const onSubmit = async (data: ClientFormData) => {
        setIsLoading(true)

        try {
            const url = clientId
                ? `/api/crm/clients/${clientId}`
                : '/api/crm/clients'

            const method = clientId ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Erro ao salvar cliente')
            }

            toast.success(clientId ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!')
            onSuccess?.()
        } catch (error) {
            console.error('Error saving client:', error)
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar cliente')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
                {/* Tipo de Cliente */}
                <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Cliente *</Label>
                    <Select
                        value={clientType}
                        onValueChange={(value) => setValue('type', value as 'pf' | 'pj')}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pf">Pessoa Física</SelectItem>
                            <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.type && (
                        <p className="text-sm text-red-600">{errors.type.message}</p>
                    )}
                </div>

                {/* Nome */}
                <div className="space-y-2">
                    <Label htmlFor="name">
                        {clientType === 'pf' ? 'Nome Completo' : 'Razão Social'} *
                    </Label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder={clientType === 'pf' ? 'João da Silva' : 'Empresa Ltda'}
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                </div>

                {/* CPF/CNPJ */}
                <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">
                        {clientType === 'pf' ? 'CPF' : 'CNPJ'}
                    </Label>
                    <Input
                        id="cpfCnpj"
                        {...register('cpfCnpj')}
                        placeholder={clientType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                        disabled={isLoading}
                        maxLength={clientType === 'pf' ? 14 : 18}
                        onChange={(e) => {
                            const formatted = clientType === 'pf'
                                ? formatCPF(e.target.value)
                                : formatCNPJ(e.target.value)
                            setValue('cpfCnpj', formatted)
                        }}
                    />
                    {errors.cpfCnpj && (
                        <p className="text-sm text-red-600">{errors.cpfCnpj.message}</p>
                    )}
                </div>

                {/* Email e Telefone */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="email@exemplo.com"
                            disabled={isLoading}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            {...register('phone')}
                            placeholder="(00) 00000-0000"
                            disabled={isLoading}
                            maxLength={15}
                            onChange={(e) => {
                                const formatted = formatPhone(e.target.value)
                                setValue('phone', formatted)
                            }}
                        />
                    </div>
                </div>

                <div className="border-t border-border my-4 pt-4">
                    <h3 className="font-medium mb-4">Endereço</h3>

                    {/* CEP */}
                    <div className="space-y-2 mb-4">
                        <Label htmlFor="zipCode">CEP</Label>
                        <div className="relative w-40">
                            <Input
                                id="zipCode"
                                {...register('zipCode')}
                                placeholder="00000-000"
                                disabled={isLoading || isLoadingCEP}
                                maxLength={9}
                                onChange={(e) => {
                                    const formatted = formatCEP(e.target.value)
                                    setValue('zipCode', formatted)
                                }}
                            />
                            {isLoadingCEP && (
                                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 mb-4">
                        {/* Rua */}
                        <div className="md:col-span-3 space-y-2">
                            <Label htmlFor="street">Rua</Label>
                            <Input
                                id="street"
                                {...register('street')}
                                placeholder="Rua, Avenida..."
                                disabled={isLoading}
                            />
                        </div>

                        {/* Número */}
                        <div className="space-y-2">
                            <Label htmlFor="number">Número</Label>
                            <Input
                                id="number"
                                {...register('number')}
                                placeholder="123"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                        {/* Complemento */}
                        <div className="space-y-2">
                            <Label htmlFor="complement">Complemento</Label>
                            <Input
                                id="complement"
                                {...register('complement')}
                                placeholder="Apto 101, Bloco A"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Bairro */}
                        <div className="space-y-2">
                            <Label htmlFor="neighborhood">Bairro</Label>
                            <Input
                                id="neighborhood"
                                {...register('neighborhood')}
                                placeholder="Centro"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Cidade e Estado */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="city">Cidade</Label>
                            <Input
                                id="city"
                                {...register('city')}
                                placeholder="São Paulo"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">Estado</Label>
                            <Input
                                id="state"
                                {...register('state')}
                                placeholder="SP"
                                maxLength={2}
                                disabled={isLoading}
                                onChange={(e) => setValue('state', e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={watch('status')}
                        onValueChange={(value) => setValue('status', value as any)}
                        disabled={isLoading}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lead">Lead</SelectItem>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="archived">Arquivado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Lead Stage - Only visible when status is 'lead' */}
                {watch('status') === 'lead' && (
                    <div className="space-y-2">
                        <Label htmlFor="leadStage">Estágio do Lead</Label>
                        <Select
                            value={watch('leadStage')}
                            onValueChange={(value) => setValue('leadStage', value as any)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">Novo</SelectItem>
                                <SelectItem value="qualified">Qualificado</SelectItem>
                                <SelectItem value="proposal">Proposta</SelectItem>
                                <SelectItem value="negotiation">Negociação</SelectItem>
                                <SelectItem value="won">Ganho (Converter)</SelectItem>
                                <SelectItem value="lost">Perdido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {clientId ? 'Atualizar' : 'Criar'} Cliente
                </Button>
            </div>
        </form>
    )
}
