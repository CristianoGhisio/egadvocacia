import { CalendarView } from "@/components/calendar/calendar-view"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Calendário | EG Advocacia",
    description: "Gestão de prazos e audiências",
}

export default function CalendarPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Calendário Central</h2>
            </div>
            <div className="flex-1 flex flex-col">
                <CalendarView />
            </div>
        </div>
    )
}
