# EG Advocacia - Sistema ERP/CRM Jurídico

Sistema completo de gestão para escritórios de advocacia construído com Next.js, Supabase e Vercel.

## 🚀 Stack Tecnológica

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase Functions
- **Database**: Supabase PostgreSQL com Row Level Security
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## ✨ Funcionalidades Implementadas (MVP)

### ✅ Infraestrutura
- Projeto Next.js configurado com TypeScript
- Supabase client (browser, server, admin)
- Middleware de autenticação
- Utilities e helpers

### ✅ Database Schema
- **Core**: Tenants, Users, Roles, Audit Log
- **CRM**: Clients, Contacts, Interactions
- **Cases**: Matters, Tasks, Deadlines, Hearings, Activities
- **Documents**: Documents, Versions, Templates
- **Billing**: Time Entries, Invoices, Invoice Items, Payments

### 🔜 Próximas Etapas
- Componentes UI (shadcn/ui)
- Páginas de autenticação
- Módulos: CRM, Cases, Documents, Billing
- Dashboard e relatórios

## 📋 Pré-requisitos

Antes de começar, você precisará criar contas nos seguintes serviços:

1. **Supabase** (obrigatório)
   - Acesse: https://supabase.com
   - Crie um novo projeto
   - Copie a URL e as chaves

2. **Vercel** (para deploy)
   - Acesse: https://vercel.com
   - Conecte seu repositório GitHub

3. **Serviços opcionais** (para funcionalidades avançadas):
   - Stripe/Asaas (pagamentos)
   - ClickSign (assinatura digital)
   - Resend (envio de emails)
   - OpenAI (funcionalidades de IA)

## 🔧 Configuração

### 1. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local` e preencha suas credenciais:

```env
# Obtenha estes valores no dashboard do Supabase
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico

# Gere um secret seguro para NextAuth
NEXTAUTH_SECRET=sua-chave-secreta-aqui
```

### 2. Executar migrações do banco de dados

No dashboard do Supabase:

1. Vá em **SQL Editor**
2. Execute cada arquivo de migração em ordem:
   - `supabase/migrations/001_core_schema.sql`
   - `supabase/migrations/002_crm_schema.sql`
   - `supabase/migrations/003_cases_schema.sql`
   - `supabase/migrations/004_documents_schema.sql`
   - `supabase/migrations/005_billing_schema.sql`
   - `supabase/migrations/006_audit_triggers.sql`

### 3. Configurar Storage Buckets no Supabase

No dashboard do Supabase, vá em **Storage** e crie os seguintes buckets:

- `documents` (privado)
- `court-files` (privado)
- `contracts` (privado)
- `uploads-from-client` (privado)

Configure as RLS policies para cada bucket permitindo acesso apenas aos usuários do mesmo tenant.

### 4. Instalar dependências e rodar o projeto

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
egadvocacia/
├── src/
│   ├── app/                      # App Router do Next.js
│   │   ├── (dashboard)/          # Rotas protegidas do dashboard
│   │   │   ├── crm/              # Módulo CRM
│   │   │   ├── cases/            # Módulo de Processos
│   │   │   ├── documents/        # Módulo de Documentos
│   │   │   ├── billing/          # Módulo de Faturamento
│   │   │   ├── calendar/         # Calendário e Prazos
│   │   │   └── settings/         # Configurações
│   │   ├── api/                  # API Routes
│   │   └── auth/                 # Autenticação
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Componentes shadcn/ui
│   │   ├── layout/               # Layout components
│   │   ├── crm/                  # Componentes CRM
│   │   ├── cases/                # Componentes de Processos
│   │   └── ...
│   ├── lib/                      # Bibliotecas e utilitários
│   │   ├── supabase/             # Configuração Supabase
│   │   ├── types/                # TypeScript types
│   │   ├── auth.ts               # Auth helpers
│   │   └── utils.ts              # Utility functions
│   └── middleware.ts             # Next.js middleware
├── supabase/
│   └── migrations/               # Migrações do banco de dados
├── public/                       # Assets estáticos
├── .env.example                   # Template de variáveis de ambiente
└── package.json
```

## 🔐 Autenticação e Permissões

O sistema implementa controle de acesso baseado em roles (RBAC):

### Roles disponíveis:
- **admin**: Acesso total ao sistema
- **partner**: Sócio - gerenciamento completo
- **lawyer**: Advogado - gerenciamento de casos e clientes
- **intern**: Estagiário - acesso limitado
- **financial**: Financeiro - acesso a billing e pagamentos
- **support**: Suporte - acesso limitado
- **client**: Cliente - acesso apenas ao portal do cliente

### Multi-tenant

Todos os dados são isolados por `tenant_id` usando Row Level Security (RLS) do PostgreSQL. Cada escritório de advocacia é um tenant separado.

## 🗄️ Esquema do Banco de Dados

### Core Schema
- `tenants`: Escritórios de advocacia
- `users`: Usuários do sistema
- `roles`: Roles personalizados
- `audit_log`: Log de auditoria de todas as ações

### CRM Schema
- `clients`: Clientes (PF/PJ)
- `contacts`: Contatos dos clientes
- `interactions`: Histórico de interações

### Cases Schema
- `matters`: Processos/Causas
- `tasks`: Tarefas
- `deadlines`: Prazos processuais
- `hearings`: Audiências
- `activities`: Timeline de atividades

### Documents Schema
- `documents`: Documentos
- `versions`: Versionamento de documentos
- `templates`: Templates de documentos

### Billing Schema
- `time_entries`: Lançamento de horas
- `invoices`: Faturas
- `invoice_items`: Itens da fatura
- `payments`: Pagamentos recebidos

## 🚢 Deploy

### Vercel

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

```bash
# Ou usar Vercel CLI
vercel
```

### Supabase

O Supabase já está hospedado. Certifique-se de:
- Executar todas as migrações
- Configurar os buckets de storage
- Ativar Row Level Security

## 📚 Documentação

Consulte os seguintes arquivos para mais informações:

- `referencia.md`: Documento de referência completo do sistema
- `implementation_plan.md`: Plano de implementação detalhado
- `task.md`: Checklist de tarefas

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar produção localmente
npm start

# Lint
npm run lint

# Testes (quando implementados)
npm test
```

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs de erro
3. Verifique as configurações do Supabase

## 📝 Licença

Proprietário - EG Advocacia

---

**Status do Projeto**: 🚧 Em desenvolvimento ativo

**Última atualização**: Dezembro 2025
