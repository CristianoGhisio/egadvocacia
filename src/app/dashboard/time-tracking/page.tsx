'use client'

import { useState, useEffect, useCallback } from 'react'
import { TimeEntryForm } from '@/components/billing/time-entry-form'
import { TimeEntryList, TimeEntry } from '@/components/billing/time-entry-list'
import { Loader2 } from 'lucide-react'

interface MatterOption {
    id: string
    title: string
    clientName: string
}

export default function TimeTrackingPage() {
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [matters, setMatters] = useState<MatterOption[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            // Fetch Entries
            const resEntries = await fetch('/api/billing/time-entries')
            const dataEntries = await resEntries.json()
            setEntries(dataEntries)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Need to fetch matters separately to populate the select
    const fetchMatters = useCallback(async () => {
        try {
            // We'll use a specific lookup endpoint or the general cases endpoint
            const res = await fetch('/api/cases?status=open')
            if (res.ok) {
                const data = await res.json()
                setMatters(data.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    clientName: m.client.name
                })))
            }
        } catch (e) {
            console.log("Failed to load matters")
        }
    }, [])

    useEffect(() => {
        fetchData()
        fetchMatters()
    }, [fetchData, fetchMatters])

    const handleSuccess = () => {
        fetchData()
    }

    const handleDelete = (id: string) => {
        setEntries(prev => prev.filter(e => e.id !== id))
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Time Tracking</h2>
            </div>

            <div className="flex flex-col gap-8">
                {/* Form Area */}
                <div className="w-full max-w-4xl">
                    <TimeEntryForm onSuccess={handleSuccess} matters={matters} />
                </div>

                {/* List Area */}
                <div className="flex-1">
                    <h3 className="text-lg font-medium mb-4">Lançamentos Recentes</h3>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <TimeEntryList entries={entries} onDelete={handleDelete} />
                    )}
                </div>
            </div>
        </div>
    )
}
