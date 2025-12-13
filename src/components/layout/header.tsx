'use client'

import { useEffect, useState } from 'react'
import { Bell, LogOut, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signOut } from 'next-auth/react'

type AlertItem = { id: string; type: 'deadline' | 'hearing'; title: string; date: string; daysUntil: number; matterTitle?: string | null; clientName?: string | null }

export function Header() {
    const [alerts, setAlerts] = useState<AlertItem[]>([])
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/auth/login' })
    }

    useEffect(() => {
        let mounted = true
        async function load() {
            try {
                const res = await fetch('/api/alerts')
                if (res.ok) {
                    const data = await res.json()
                    if (mounted) setAlerts(data)
                }
            } catch {
            }
        }
        load()
        const interval = setInterval(load, 60_000)
        return () => { mounted = false; clearInterval(interval) }
    }, [])

    const count = alerts.length

    return (
        <header className="flex h-16 items-center gap-4 border-b bg-white px-6">
            <div className="flex-1">
                <div className="relative max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar processos, clientes, documentos..."
                        className="w-full pl-8"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 relative">
                <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(v => !v)}>
                    <Bell className="h-5 w-5" />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                            {count}
                        </span>
                    )}
                </Button>
                {open && (
                    <div className="absolute right-16 top-10 w-80 bg-white border rounded-md shadow-sm z-50">
                        <div className="px-3 py-2 text-sm font-medium">Alertas</div>
                        <div className="max-h-72 overflow-y-auto">
                            {alerts.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-muted-foreground">Sem alertas</div>
                            ) : (
                                alerts.slice(0, 8).map(a => (
                                    <div key={a.id} className="px-3 py-2 border-t text-sm">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{a.type === 'deadline' ? 'Prazo' : 'Audiência'}</span>
                                            <span className="text-xs text-muted-foreground">em {a.daysUntil}d</span>
                                        </div>
                                        <div className="text-sm">{a.title}</div>
                                        <div className="text-xs text-muted-foreground">{a.matterTitle || ''}{a.clientName ? ` · ${a.clientName}` : ''}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <Avatar>
                    <AvatarFallback className="bg-primary text-white">
                        U
                    </AvatarFallback>
                </Avatar>
                <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Sair
                </Button>
            </div>
        </header>
    )
}
