import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, AlertCircle, DollarSign, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { startOfMonth, addMonths, startOfDay, endOfDay, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

async function getStats(tenantId: string) {
    const [activeClients, openCases, pendingDeadlines, todayDeadlines, outstandingInvoices, outstandingAgg, monthHours] = await Promise.all([
        prisma.client.count({ where: { tenantId, status: 'active' } }),
        prisma.matter.count({ where: { tenantId, status: 'open' } }),
        prisma.deadline.count({ where: { tenantId, isCompleted: false } }),
        prisma.deadline.count({ where: { tenantId, isCompleted: false, deadlineDate: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) } } }),
        prisma.invoice.count({ where: { tenantId, status: { in: ['pending', 'overdue'] } } }),
        prisma.invoice.aggregate({
            where: { tenantId, status: { in: ['pending', 'overdue'] } },
            _sum: { totalAmount: true },
        }),
        prisma.timeEntry.aggregate({
            where: {
                tenantId,
                date: {
                    gte: startOfMonth(new Date()),
                    lt: addMonths(startOfMonth(new Date()), 1),
                },
            },
            _sum: { hours: true },
        }),
    ])

    return {
        activeClients,
        openCases,
        pendingDeadlines,
        todayDeadlines,
        outstandingInvoices,
        outstandingAmount: outstandingAgg._sum.totalAmount || 0,
        hoursThisMonth: monthHours._sum.hours || 0,
    }
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    const tenantId = session?.user?.tenantId || ''
    const stats = await getStats(tenantId)

    const statCards = [
        {
            title: 'Clientes Ativos',
            value: stats.activeClients,
            icon: Users,
            description: '+3 este mês',
            trend: 'up'
        },
        {
            title: 'Processos Abertos',
            value: stats.openCases,
            icon: Briefcase,
            description: '12 em andamento',
            trend: 'neutral'
        },
        {
            title: 'Prazos Pendentes',
            value: stats.pendingDeadlines,
            icon: AlertCircle,
            description: `${stats.todayDeadlines} vencendo hoje`,
            trend: 'down',
            urgent: true
        },
        {
            title: 'Faturas Pendentes',
            value: stats.outstandingInvoices,
            icon: DollarSign,
            description: formatCurrency(stats.outstandingAmount),
            trend: 'neutral'
        },
        {
            title: 'Horas Este Mês',
            value: stats.hoursThisMonth,
            icon: Clock,
            description: '342.5h registradas',
            trend: 'up'
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Bem-vindo(a), {session?.user?.name || 'Usuário'}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <Card key={card.title} className={card.urgent ? 'border-red-200 bg-red-50' : ''}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {card.title}
                                </CardTitle>
                                <Icon className={`h-4 w-4 ${card.urgent ? 'text-red-600' : 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className={`text-xs ${card.urgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Prazos de Hoje</CardTitle>
                        <CardDescription>Atenção aos prazos que vencem hoje</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {await (async () => {
                            const todayDeadlines = await prisma.deadline.findMany({
                                where: {
                                    tenantId,
                                    isCompleted: false,
                                    deadlineDate: {
                                        gte: startOfDay(new Date()),
                                        lte: endOfDay(new Date()),
                                    },
                                },
                                orderBy: { deadlineDate: 'asc' },
                                take: 5,
                                include: {
                                    matter: { include: { client: true } },
                                },
                            })
                            if (todayDeadlines.length === 0) {
                                return (
                                    <div className="text-sm text-muted-foreground">Nenhum prazo vence hoje.</div>
                                )
                            }
                            return (
                                <div className="space-y-3">
                                    {todayDeadlines.map((d) => (
                                        <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{d.title} — {d.matter.title}</p>
                                                <p className="text-sm text-muted-foreground">Cliente: {d.matter.client.name}</p>
                                            </div>
                                            <span className="text-sm font-medium text-red-600">Hoje</span>
                                        </div>
                                    ))}
                                </div>
                            )
                        })()}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Atividades Recentes</CardTitle>
                        <CardDescription>Últimas ações no sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {await (async () => {
                            const activities = await prisma.activity.findMany({
                                where: { tenantId },
                                orderBy: { createdAt: 'desc' },
                                take: 5,
                                include: { matter: true, user: true },
                            })
                            if (activities.length === 0) {
                                return (
                                    <div className="text-sm text-muted-foreground">Nenhuma atividade recente.</div>
                                )
                            }
                            return (
                                <div className="space-y-3">
                                    {activities.map((a) => (
                                        <div key={a.id} className="flex items-start gap-3">
                                            <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{a.action}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {a.user?.fullName ? `${a.user.fullName} • ` : ''}
                                                    {a.matter?.title ? `${a.matter.title} • ` : ''}
                                                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        })()}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
