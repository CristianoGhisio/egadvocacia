import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, AlertCircle, DollarSign, Clock } from 'lucide-react'

async function getStats() {
    // TODO: Fetch real stats from database
    return {
        activeClients: 45,
        openCases: 23,
        pendingDeadlines: 7,
        outstandingInvoices: 12,
        totalRevenue: 125000,
        hoursThisMonth: 342.5,
    }
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    const stats = await getStats()

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
            description: '3 vencendo hoje',
            trend: 'down',
            urgent: true
        },
        {
            title: 'Faturas Pendentes',
            value: stats.outstandingInvoices,
            icon: DollarSign,
            description: 'R$ 125.000,00',
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
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">Contestação - Processo 1234567</p>
                                    <p className="text-sm text-muted-foreground">Cliente: Silva & Associados</p>
                                </div>
                                <span className="text-sm font-medium text-red-600">Hoje</span>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">Recurso - Processo 7654321</p>
                                    <p className="text-sm text-muted-foreground">Cliente: João Santos</p>
                                </div>
                                <span className="text-sm font-medium text-red-600">Hoje</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Atividades Recentes</CardTitle>
                        <CardDescription>Últimas ações no sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Novo processo cadastrado</p>
                                    <p className="text-xs text-muted-foreground">há 2 horas</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-green-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Fatura #1234 paga</p>
                                    <p className="text-xs text-muted-foreground">há 4 horas</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 h-2 w-2 rounded-full bg-purple-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Documento assinado</p>
                                    <p className="text-xs text-muted-foreground">há 5 horas</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
