import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...')

    const tenant = await prisma.tenant.upsert({
        where: { cnpj: '12.345.678/0001-90' },
        update: {},
        create: {
            name: 'EG Advocacia',
            cnpj: '12.345.678/0001-90',
            email: 'contato@egadvocacia.com',
            phone: '(11) 98765-4321',
            isActive: true,
        },
    })

    console.log('✅ Tenant criado:', tenant.name)

    const adminPassword = await hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@egadvocacia.com' },
        update: {
            tenantId: tenant.id,
            fullName: 'Administrador',
            password: adminPassword,
            role: 'admin',
            isActive: true,
        },
        create: {
            tenantId: tenant.id,
            fullName: 'Administrador',
            email: 'admin@egadvocacia.com',
            password: adminPassword,
            role: 'admin',
            isActive: true,
        },
    })

    console.log('✅ Usuário admin criado:', admin.email)

    const eduardaPassword = await hash('26071999', 10)
    const eduardaAdmin = await prisma.user.upsert({
        where: { email: 'eduarda@egadvocacia.com' },
        update: {
            tenantId: tenant.id,
            fullName: 'Eduarda',
            password: eduardaPassword,
            role: 'admin',
            isActive: true,
        },
        create: {
            tenantId: tenant.id,
            fullName: 'Eduarda',
            email: 'eduarda@egadvocacia.com',
            password: eduardaPassword,
            role: 'admin',
            isActive: true,
        },
    })

    console.log('✅ Usuário admin criado:', eduardaAdmin.email)

    console.log('\n🎉 Seed concluído com sucesso!')
    console.log('\n📝 Credenciais de acesso:')
    console.log('   Admin padrão: admin@egadvocacia.com / admin123')
    console.log('   Admin Eduarda: eduarda@egadvocacia.com / 26071999')
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
