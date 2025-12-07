export interface CalendarEvent {
    id: string
    title: string
    date: string | Date
    type: 'deadline' | 'hearing'
    status: string
    matterId: string
    matterTitle: string
    location?: string | null
}
