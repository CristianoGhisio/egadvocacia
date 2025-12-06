import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...')

    // Criar tenant de exemplo
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

    // Criar usuário admin
    const adminPassword = await hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@egadvocacia.com' },
        update: {},
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

    // Criar um advogado de exemplo
    const lawyerPassword = await hash('lawyer123', 10)
    const lawyer = await prisma.user.upsert({
        where: { email: 'advogado@egadvocacia.com' },
        update: {},
        create: {
            tenantId: tenant.id,
            fullName: 'Dr. João Silva',
            email: 'advogado@egadvocacia.com',
            password: lawyerPassword,
            role: 'lawyer',
            isActive: true,
        },
    })

    console.log('✅ Advogado criado:', lawyer.email)

    // Criar alguns clientes de exemplo
    const client1 = await prisma.client.create({
        data: {
            tenantId: tenant.id,
            type: 'pf',
            name: 'Maria Santos',
            cpfCnpj: '123.456.789-00',
            email: 'maria@example.com',
            phone: '(11) 91234-5678',
            status: 'active',
            responsibleLawyerId: lawyer.id,
        },
    })

    const client2 = await prisma.client.create({
        data: {
            tenantId: tenant.id,
            type: 'pj',
            name: 'Silva & Associados Ltda',
            cpfCnpj: '98.765.432/0001-10',
            email: 'contato@silva.com',
            phone: '(11) 93456-7890',
            status: 'active',
            responsibleLawyerId: lawyer.id,
        },
    })

    console.log('✅ Clientes criados:', client1.name, client2.name)

    // Criar alguns processos de exemplo
    const matter1 = await prisma.matter.create({
        data: {
            tenantId: tenant.id,
            clientId: client1.id,
            processNumber: '1234567-89.2024.8.26.0100',
            title: 'Ação Trabalhista - CLT',
            description: 'Reclamação trabalhista por horas extras não pagas',
            court: 'TRT 2ª Região',
            district: 'São Paulo',
            department: '1ª Vara do Trabalho',
            instance: '1ª instância',
            practiceArea: 'Trabalhista',
            status: 'open',
            responsibleLawyerId: lawyer.id,
            riskScore: 7,
        },
    })

    const matter2 = await prisma.matter.create({
        data: {
            tenantId: tenant.id,
            clientId: client2.id,
            processNumber: '2345678-90.2024.8.26.0200',
            title: 'Recuperação de Crédito',
            description: 'Cobrança de valores devidos conforme contrato',
            court: 'TJSP',
            district: 'São Paulo',
            department: '5ª Vara Cível',
            instance: '1ª instância',
            practiceArea: 'Cível',
            status: 'open',
            responsibleLawyerId: lawyer.id,
            riskScore: 4,
        },
    })

    console.log('✅ Processos criados:', matter1.title, matter2.title)

    // Criar alguns prazos
    await prisma.deadline.create({
        data: {
            tenantId: tenant.id,
            matterId: matter1.id,
            title: 'Apresentar contestação',
            description: 'Prazo para apresentação de contestação',
            deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
            alertDaysBefore: 2,
        },
    })

    await prisma.deadline.create({
        data: {
            tenantId: tenant.id,
            matterId: matter2.id,
            title: 'Protocolar recurso',
            description: 'Prazo para protocolamento de recurso',
            deadlineDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
            alertDaysBefore: 5,
        },
    })

    console.log('✅ Prazos criados')

    console.log('\n🎉 Seed concluído com sucesso!')
    console.log('\n📝 Credenciais de acesso:')
    console.log('   Admin: admin@egadvocacia.com / admin123')
    console.log('   Advogado: advogado@egadvocacia.com / lawyer123')
}

main()
    .catch((e) => {
        console.error('❌ Erro ao executar seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
