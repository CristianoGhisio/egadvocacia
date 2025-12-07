'use client'

import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarGrid } from './calendar-grid'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CalendarEvent } from '@/types/calendar'

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)

    const fetchEvents = async (date: Date) => {
        setIsLoading(true)
        try {
            const start = startOfMonth(date).toISOString()
            const end = endOfMonth(date).toISOString()

            const res = await fetch(`/api/calendar/events?start=${start}&end=${end}`)
            if (!res.ok) throw new Error('Falha ao carregar eventos')

            const data = await res.json()
            setEvents(data)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar calendário")
        } finally {
            setIsLoading(false)
        }
    }

    // Carrega eventos sempre que o mês muda
    useEffect(() => {
        fetchEvents(currentDate)
    }, [currentDate])

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const goToToday = () => setCurrentDate(new Date())

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            const id = deleteTarget.id
            const endpoint = deleteTarget.type === 'deadline'
                ? `/api/crm/deadlines/${id}`
                : `/api/cases/hearings/${id}`
            const res = await fetch(endpoint, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            setDeleteTarget(null)
            await fetchEvents(currentDate)
            toast.success('Evento excluído')
        } catch (error) {
            toast.error('Erro ao excluir evento')
        }
    }

    return (
        <>
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold capitalize text-slate-800 tracking-tight">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Hoje
                    </Button>
                    <div className="flex items-center border rounded-md">
                        <Button variant="ghost" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[600px]">
                <CalendarGrid currentDate={currentDate} events={events} onDelete={setDeleteTarget} />
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-200"></div>
                    <span>Prazos</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200"></div>
                    <span>Audiências</span>
                </div>
            </div>
        </div>
        {deleteTarget && (
            <>
                <div className="fixed inset-0 z-40 bg-black/50" />
                <dialog
                    open
                    className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-md p-6 shadow-xl"
                >
                    <div className="space-y-3">
                        <div className="text-lg font-semibold">Excluir Evento</div>
                        <div className="text-sm text-muted-foreground">Esta ação é definitiva e não poderá ser desfeita.</div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button className="px-3 py-2 border rounded" onClick={() => setDeleteTarget(null)}>Cancelar</button>
                            <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>Excluir</button>
                        </div>
                    </div>
                </dialog>
            </>
        )}
        </>
    )
}
