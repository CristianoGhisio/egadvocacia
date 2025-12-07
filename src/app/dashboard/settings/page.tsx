import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building, Shield, Bell } from "lucide-react"
import Link from "next/link"

const settingsModules = [
    {
        title: "Usuários e Permissões",
        description: "Gerencie quem tem acesso ao sistema e seus papéis.",
        icon: Users,
        href: "/dashboard/settings/users"
    },
    {
        title: "Escritório",
        description: "Dados da empresa, logo e informações legais.",
        icon: Building,
        href: "/dashboard/settings/tenant"
    },
    {
        title: "Segurança",
        description: "Configure políticas de senha e autenticação.",
        icon: Shield,
        href: "/dashboard/settings/security"
    },
    {
        title: "Notificações",
        description: "Preferências de alertas e emails.",
        icon: Bell,
        href: "/dashboard/settings/notifications"
    }
]

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">
                    Gerencie as configurações gerais do sistema.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {settingsModules.map((module) => (
                    <Link href={module.href} key={module.href}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                            <CardHeader>
                                <module.icon className="h-8 w-8 mb-2 text-primary" />
                                <CardTitle>{module.title}</CardTitle>
                                <CardDescription>{module.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
