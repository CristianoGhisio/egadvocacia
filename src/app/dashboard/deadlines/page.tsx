import { DeadlineList } from "@/components/deadlines/deadline-list"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Prazos | EG Advocacia",
    description: "Gestão centralizada de prazos processuais",
}

export default function DeadlinesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Gestão de Prazos</h2>
            </div>
            <div className="flex-1">
                <DeadlineList />
            </div>
        </div>
    )
}
