'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DocumentEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    document: any
    onSuccess: () => void
}

interface ClientOption {
    id: string
    label: string
}

interface MatterOption {
    id: string
    label: string
    clientId: string // Needed for filtering
}

export function DocumentEditDialog({ open, onOpenChange, document, onSuccess }: DocumentEditDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClientId, setSelectedClientId] = useState<string>('')
    const [selectedMatterId, setSelectedMatterId] = useState<string>('')

    const [clients, setClients] = useState<ClientOption[]>([])
    const [matters, setMatters] = useState<MatterOption[]>([])

    // Filter matters based on selected client
    const [filteredMatters, setFilteredMatters] = useState<MatterOption[]>([])

    const [openClient, setOpenClient] = useState(false)
    const [openMatter, setOpenMatter] = useState(false)

    // Init state when document opens
    useEffect(() => {
        if (open && document) {
            setSelectedClientId(document.client?.id || '')
            setSelectedMatterId(document.matter?.id || '')
        }
    }, [open, document])

    // Load Data
    useEffect(() => {
        if (open) {
            const fetchData = async () => {
                try {
                    const [resClients, resCases] = await Promise.all([
                        fetch('/api/crm/clients'),
                        fetch('/api/cases')
                    ])

                    if (resClients.ok) {
                        const data = await resClients.json()
                        setClients(data.map((c: any) => ({
                            id: c.id,
                            label: c.cpfCnpj
                                ? `${c.name} - ${c.cpfCnpj}`
                                : c.name
                        })))
                    }

                    if (resCases.ok) {
                        const data = await resCases.json()
                        // Store clientId in the option for filtering
                        setMatters(data.map((m: any) => ({
                            id: m.id,
                            label: m.client?.name
                                ? `${m.title} - ${m.client.name}`
                                : m.title,
                            clientId: m.client?.id
                        })))
                    }
                } catch (error) {
                    console.error('Error fetching data', error)
                }
            }
            fetchData()
        }
    }, [open])

    // Update filtered matters when client changes
    useEffect(() => {
        if (selectedClientId) {
            const filtered = matters.filter(m => m.clientId === selectedClientId)

            // If the currently selected matter doesn't belong to the new client, clear it
            if (selectedMatterId) {
                const currentMatter = matters.find(m => m.id === selectedMatterId)
                if (currentMatter && currentMatter.clientId !== selectedClientId) {
                    setSelectedMatterId('')
                }
            }

            setFilteredMatters(filtered)
        } else {
            // If no client selected, show all matters (or none? user prefers strict logic)
            // Strategy: Allow selecting any matter, but if a matter is selected, AUTO-SELECT its client
            setFilteredMatters(matters)
        }
    }, [selectedClientId, matters, selectedMatterId])

    const handleClientSelect = (clientId: string) => {
        if (selectedClientId === clientId) {
            // Deselecting client - clear everything
            setSelectedClientId('')
            setSelectedMatterId('')
        } else {
            setSelectedClientId(clientId)
            // Should probably clear matter if it mismatches, effect handles this but safe to clear here too if logic requires
        }
        setOpenClient(false)
    }

    const handleMatterSelect = (matter: MatterOption) => {
        if (selectedMatterId === matter.id) {
            setSelectedMatterId('')
        } else {
            setSelectedMatterId(matter.id)
            // Auto-select client if known
            if (matter.clientId) {
                setSelectedClientId(matter.clientId)
            }
        }
        setOpenMatter(false)
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/documents/${document.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClientId || null,
                    matterId: selectedMatterId || null
                })
            })

            if (!res.ok) throw new Error()

            toast.success('Documento atualizado!')
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error('Erro ao atualizar documento')
        } finally {
            setIsLoading(false)
        }
    }

    // Helper to clear selection
    const clearClient = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedClientId('')
        setSelectedMatterId('')
    }

    const clearMatter = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedMatterId('')
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Vínculos</DialogTitle>
                    <DialogDescription>
                        Associe este documento a um cliente ou processo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Client Selector */}
                    <div className="flex flex-col space-y-2">
                        <Label>Cliente</Label>
                        <div className="flex gap-2">
                            <Popover open={openClient} onOpenChange={setOpenClient}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openClient}
                                        className="justify-between w-full"
                                    >
                                        <span className="truncate">
                                            {selectedClientId
                                                ? clients.find((c) => c.id === selectedClientId)?.label
                                                : "Selecione um cliente..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar cliente..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                {clients.map((client) => (
                                                    <CommandItem
                                                        key={client.id}
                                                        value={client.label}
                                                        onSelect={() => handleClientSelect(client.id)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {client.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedClientId && (
                                <Button size="icon" variant="ghost" onClick={clearClient} title="Remover vínculo">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Matter Selector */}
                    <div className="flex flex-col space-y-2">
                        <Label>Processo</Label>
                        <div className="flex gap-2">
                            <Popover open={openMatter} onOpenChange={setOpenMatter}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openMatter}
                                        className="justify-between w-full"
                                    >
                                        <span className="truncate">
                                            {selectedMatterId
                                                ? matters.find((m) => m.id === selectedMatterId)?.label
                                                : "Selecione um processo..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar processo..." />
                                        <CommandList>
                                            <CommandEmpty>{selectedClientId ? 'Nenhum processo para este cliente.' : 'Nenhum processo encontrado.'}</CommandEmpty>
                                            <CommandGroup>
                                                {filteredMatters.map((matter) => (
                                                    <CommandItem
                                                        key={matter.id}
                                                        value={matter.label}
                                                        onSelect={() => handleMatterSelect(matter)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                selectedMatterId === matter.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {matter.label}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {selectedMatterId && (
                                <Button size="icon" variant="ghost" onClick={clearMatter} title="Remover vínculo">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
