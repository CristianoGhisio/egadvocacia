'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Gavel, Clock } from 'lucide-react'
import { CalendarEvent } from '@/types/calendar'

interface EventCardProps {
    event: CalendarEvent
}

export function EventCard({ event }: EventCardProps) {
    const router = useRouter()

    const isDeadline = event.type === 'deadline'
    const isCompleted = event.status === 'completed' || event.status === 'done'

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        router.push(`/dashboard/cases/${event.matterId}`)
    }

    return (
        <div
            onClick={handleClick}
            className={cn(
                "group relative flex flex-col gap-1 rounded-md border p-2 text-xs shadow-sm transition-all hover:shadow-md cursor-pointer",
                isDeadline
                    ? "border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30"
                    : "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30",
                isCompleted && "opacity-60 grayscale"
            )}
        >
            <div className="flex items-center justify-between font-medium">
                <span className="truncate flex-1">{event.title}</span>
                {isDeadline ? (
                    <Clock className="h-3 w-3 text-orange-500" />
                ) : (
                    <Gavel className="h-3 w-3 text-blue-500" />
                )}
            </div>

            <div className="text-[10px] text-muted-foreground truncate">
                {event.matterTitle}
            </div>

            {event.location && (
                <div className="text-[10px] text-muted-foreground truncate italic">
                    📍 {event.location}
                </div>
            )}
        </div>
    )
}
