'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Scale,
    FolderOpen,
    Calendar,
    Clock,
    DollarSign,
    Settings,
    Target,
    Banknote,
} from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'CRM / Pipeline', href: '/dashboard/crm/leads', icon: Target },
    { name: 'CRM / Clientes', href: '/dashboard/crm/clients', icon: Users },
    { name: 'Processos', href: '/dashboard/cases', icon: Scale },
    { name: 'Documentos', href: '/dashboard/documents', icon: FolderOpen },
    { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
    { name: 'Prazos', href: '/dashboard/deadlines', icon: Clock },
    { name: 'Time Tracking', href: '/dashboard/time-tracking', icon: Clock },
    { name: 'Faturamento', href: '/dashboard/billing', icon: DollarSign },
    { name: 'Financeiro', href: '/dashboard/finance', icon: Banknote },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <Scale className="h-6 w-6 mr-2" />
                <span className="text-lg font-semibold">EG Advocacia</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
