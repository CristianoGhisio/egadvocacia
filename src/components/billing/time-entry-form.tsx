'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'

const formSchema = z.object({
    description: z.string().min(1, "Descrição obrigatória"),
    hours: z.string().min(1, "Horas obrigatórias"),
    date: z.string(), // YYYY-MM-DD
    matterId: z.string().optional(),
    billable: z.boolean().default(true),
})

interface TimeEntryFormProps {
    onSuccess: () => void
    matters: { id: string; title: string; clientName: string }[]
}

export function TimeEntryForm({ onSuccess, matters }: TimeEntryFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: "",
            hours: "0", // String input that will be transformed to number
            date: new Date().toISOString().split('T')[0],
            billable: true,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            // Convert hours from string to number for API
            const payload = {
                ...values,
                hours: parseFloat(values.hours)
            }
            
            const res = await fetch('/api/billing/time-entries', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            })

            if (!res.ok) throw new Error()

            toast.success("Horas lançadas com sucesso!")
            form.reset({
                description: "",
                hours: "0",
                date: new Date().toISOString().split('T')[0],
                billable: true,
                matterId: undefined
            })
            onSuccess()
        } catch (error) {
            toast.error("Erro ao lançar horas")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                    <Input placeholder="O que você fez?" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="matterId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Processo / Caso</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {matters?.map((matter) => (
                                            <SelectItem key={matter.id} value={matter.id}>
                                                {matter.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="hours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Horas</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="w-40">
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center gap-4">
                        <FormField
                            control={form.control}
                            name="billable"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Faturável</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Salvando..." : "Lançar Horas"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}
