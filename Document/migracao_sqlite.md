# Migração: Supabase → SQLite Local

## ✅ O que foi feito

### 1. Substituído Supabase por SQLite + Prisma
- **Removido**: `@supabase/supabase-js`, `@supabase/ssr`, `@supabase/auth-helpers-nextjs`
- **Adicionado**: `prisma`, `@prisma/client`, `next-auth`, `bcryptjs`

### 2. Banco de Dados
- **SQLite** local (`prisma/dev.db`)
- **Prisma ORM** para gerenciamento
- Todos os schemas convertidos (Core, CRM, Cases, Documents, Billing)

### 3. Autenticação
- **NextAuth.js** com CredentialsProvider
- Senha hash com bcryptjs
- Sessions JWT

### 4. Arquivos Criados/Modificados

#### Novos Arquivos:
- `prisma/schema.prisma` - Schema completo do banco
- `prisma/seed.ts` - Dados iniciais
- `src/lib/prisma.ts` - Cliente Prisma
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth config
- `src/types/next-auth.d.ts` - Types do NextAuth

#### Modificados:
- `src/lib/auth.ts` - Agora usa Prisma em vez de Supabase
- `src/middleware.ts` - Usa NextAuth session
- `src/app/auth/login/page.tsx` - Login com NextAuth
- `src/app/(dashboard)/page.tsx` - Session do NextAuth
- `src/components/layout/sidebar.tsx` - Logout com NextAuth

## 🚀 Como usar

### 1. O servidor já está rodando!
```
http://localhost:3000
```

### 2. Credenciais de Acesso

**Admin:**
- Email: `admin@egadvocacia.com`
- Senha: `admin123`

**Advogado:**
- Email: `advogado@egadvocacia.com`
- Senha: `lawyer123`

### 3. Banco de Dados

O banco SQLite está em: `prisma/dev.db`

Para visualizar os dados:
```bash
npx prisma studio
```

Para resetar o banco:
```bash
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

## 📊 Dados Iniciais

O seed criou:
- ✅ 1 Tenant (EG Advocacia)
- ✅ 2 Usuários (admin e advogado)
- ✅ 2 Clientes (1 PF, 1 PJ)
- ✅ 2 Processos
- ✅ 2 Prazos

## 🔧 Comandos Úteis

```bash
# Gerar Prisma Client (após mudar schema)
npx prisma generate

# Aplicar mudanças no banco
npx prisma db push

# Abrir Prisma Studio (interface visual)
npx prisma studio

# Popular banco com dados
npx tsx prisma/seed.ts

# Rodar dev
npm run dev
```

## 📝 Próximos Passos

Para implementar funcionalidades:

1. **Criar páginas de listagem** (clientes, processos, etc.)
2. **Criar formulários** para cadastro
3. **Implementar APIs** usando Prisma:

```typescript
// Exemplo de API route
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  const clients = await prisma.client.findMany({
    where: {
      tenantId: session.user.tenantId
    }
  })
  
  return Response.json(clients)
}
```

## 🎯 Vantagens da Mudança

✅ **Mais simples**: Não precisa configurar Supabase
✅ **Desenvolvimento rápido**: Banco local, sem latência
✅ **Sem custos**: Tudo local
✅ **Prisma Studio**: Interface visual excelente
✅ **Fácil deploy**: Pode usar qualquer PostgreSQL/MySQL depois

## 🔄 Migrar para PostgreSQL depois

Quando quiser usar PostgreSQL em produção:

1. Mudar no `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Atualizar `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/egadvocacia"
```

3. Rodar migrations:
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

---

**Status**: ✅ Sistema 100% funcional com SQLite local!
