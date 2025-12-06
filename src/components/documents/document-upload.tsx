'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Loader2, X, Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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

interface DocumentUploadProps {
    matterId?: string
    clientId?: string
    onUploadSuccess?: () => void
}

interface Option {
    id: string
    label: string
}

interface MatterOption {
    id: string
    label: string
    clientId: string
}

export function DocumentUpload({ matterId, clientId, onUploadSuccess }: DocumentUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Linking state
    const [selectedClientId, setSelectedClientId] = useState<string>(clientId || '')
    const [selectedMatterId, setSelectedMatterId] = useState<string>(matterId || '')

    // Data state
    const [clients, setClients] = useState<Option[]>([])
    const [matters, setMatters] = useState<MatterOption[]>([])
    const [filteredMatters, setFilteredMatters] = useState<MatterOption[]>([])
    const [isLoadingData, setIsLoadingData] = useState(false)

    // UI state for comboboxes
    const [openClient, setOpenClient] = useState(false)
    const [openMatter, setOpenMatter] = useState(false)

    // Fetch data if no props provided (Standalone Mode)
    useEffect(() => {
        if (!matterId && !clientId) {
            const fetchData = async () => {
                setIsLoadingData(true)
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
                        setMatters(data.map((m: any) => ({
                            id: m.id,
                            label: m.client?.name
                                ? `${m.title} - ${m.client.name}`
                                : m.title,
                            clientId: m.client?.id
                        })))
                    }
                } catch (error) {
                    console.error('Error fetching linking data', error)
                } finally {
                    setIsLoadingData(false)
                }
            }
            fetchData()
        }
    }, [matterId, clientId])

    // Update filtered matters when client changes
    useEffect(() => {
        if (matterId || clientId) return // Don't run filter logic if props are fixed

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
            setFilteredMatters(matters)
        }
    }, [selectedClientId, matters, selectedMatterId, matterId, clientId])


    const handleClientSelect = (id: string) => {
        if (selectedClientId === id) {
            setSelectedClientId('')
            setSelectedMatterId('')
        } else {
            setSelectedClientId(id)
        }
        setOpenClient(false)
    }

    const handleMatterSelect = (matter: MatterOption) => {
        if (selectedMatterId === matter.id) {
            setSelectedMatterId('')
        } else {
            setSelectedMatterId(matter.id)
            if (matter.clientId) {
                setSelectedClientId(matter.clientId)
            }
        }
        setOpenMatter(false)
    }

    const clearClient = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedClientId('')
        setSelectedMatterId('')
    }

    const clearMatter = (e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedMatterId('')
    }


    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setIsUploading(true)
        const file = files[0]

        const formData = new FormData()
        formData.append('file', file)

        // Use props if available, otherwise use state
        const finalMatterId = matterId || selectedMatterId
        const finalClientId = clientId || selectedClientId

        if (finalMatterId) formData.append('matterId', finalMatterId)
        if (finalClientId) formData.append('clientId', finalClientId)

        try {
            const res = await fetch('/api/documents', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error()

            toast.success('Upload concluído!')
            window.dispatchEvent(new Event('document-uploaded'))
            if (onUploadSuccess) onUploadSuccess()

            // Reset selection if in standalone mode
            if (!matterId && !clientId) {
                setSelectedClientId('')
                setSelectedMatterId('')
            }

        } catch (error) {
            toast.error('Erro no upload')
            console.error(error)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleUpload(e.target.files)
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files)
        }
    }

    const isStandalone = !matterId && !clientId

    return (
        <div className="space-y-4">
            {isStandalone && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Selector */}
                    <div className="flex flex-col space-y-2">
                        <Label>Vincular Cliente</Label>
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
                                <PopoverContent className="w-[300px] p-0">
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
                        <Label>Vincular Processo</Label>
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
                                <PopoverContent className="w-[300px] p-0">
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
            )}

            <div
                className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:bg-slate-50",
                    dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300",
                    isUploading && "opacity-50 cursor-not-allowed"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                    disabled={isUploading}
                />

                <div className="flex flex-col items-center justify-center gap-2">
                    {isUploading ? (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Enviando arquivo...</p>
                        </>
                    ) : (
                        <>
                            <Upload className="h-8 w-8 text-slate-400" />
                            <p className="text-sm font-medium">
                                Clique para selecionar ou arraste um arquivo aqui
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PDF, Imagens, Word (Max 10MB)
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
