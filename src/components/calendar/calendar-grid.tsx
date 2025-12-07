'use client'

import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { EventCard } from './event-card'
import { CalendarEvent } from '@/types/calendar'

interface CalendarGridProps {
    currentDate: Date
    events: CalendarEvent[]
}

export function CalendarGrid({ currentDate, events }: CalendarGridProps) {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { locale: ptBR })
    const endDate = endOfWeek(monthEnd, { locale: ptBR })

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    return (
        <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-background">
            {/* Header dos dias da semana */}
            <div className="grid grid-cols-7 border-b bg-muted/40 text-center py-2 text-sm font-medium text-muted-foreground">
                {weekDays.map(day => (
                    <div key={day}>{day}</div>
                ))}
            </div>

            {/* Grid dos dias */}
            <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(120px,1fr)] bg-muted/20 gap-px">
                {calendarDays.map((date, idx) => {
                    const isCurrentMonth = isSameMonth(date, monthStart)
                    const isCurrentDay = isToday(date)

                    const dayEvents = events.filter(event =>
                        isSameDay(new Date(event.date), date)
                    )

                    return (
                        <div
                            key={date.toString()}
                            className={cn(
                                "flex flex-col p-2 gap-1 bg-background transition-colors min-h-[120px]",
                                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                isCurrentDay && "bg-accent/10"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                                    isCurrentDay && "bg-primary text-primary-foreground font-bold"
                                )}>
                                    {format(date, 'd')}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[150px] scrollbar-thin">
                                {dayEvents.map(event => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
