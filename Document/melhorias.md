# Melhorias sugeridas

Este documento consolida sugestões de melhorias para o projeto, com foco em
desempenho, escalabilidade, segurança e manutenibilidade.

## 1. Arquitetura e banco de dados

- **Migrar de SQLite para banco relacional em produção (PostgreSQL/MySQL)**  
  - O schema atual já está preparado para multi-tenant e alto volume de dados
    (tabelas `Tenant`, `User`, `Client`, `Matter`, `Deadline`, etc. em `prisma/schema.prisma`).  
  - SQLite é adequado para desenvolvimento, mas limita concorrência, lock de escrita
    e escalabilidade em produção.  
  - Recomendações:  
    - Provisionar um Postgres gerenciado.  
    - Ajustar `DATABASE_URL` e executar `prisma migrate`.  
    - Configurar backup, monitoramento e planos de manutenção.

- **Criar índices nos campos mais consultados**  
  - Diversas consultas usam filtros por `tenantId`, `status`, datas e chaves estrangeiras.  
  - Exemplos:  
    - `Client`: `tenantId`, `status`, `leadStage`, `cpfCnpj`.  
    - `Matter`: `tenantId`, `status`, `clientId`, `responsibleLawyerId`, `createdAt`.  
    - `Deadline`: `tenantId`, `matterId`, `deadlineDate`, `isCompleted`.  
    - `Invoice`, `Payment`, `Transaction`: campos de data e `type/status`.  
  - Adicionar índices compostos em campos usados juntos (ex.: `tenantId + status`,
    `tenantId + deadlineDate`) para reduzir tempo de resposta em listagens.

- **Padronizar armazenamento de JSON**  
  - Vários campos usam `String` para JSON (ex.: `tags`, `metadata`, `settings` em
    `prisma/schema.prisma`).  
  - Em bancos que suportam `JSONB` (Postgres), considerar alterar o tipo para permitir
    filtros mais avançados, índices GIN e validação mais robusta.

## 2. API e backend (Next.js / Prisma)

- **Adicionar paginação em todas as listagens**  
  - Rotas como `src/app/api/cases/route.ts`, `src/app/api/crm/clients/route.ts`,
    `src/app/api/finance/transactions/route.ts` realizam `findMany` sem `take/skip`.  
  - Em ambientes com muitos registros, isso impacta diretamente a performance e a UX.  
  - Recomendações:  
    - Padronizar query params `page`, `pageSize` (com limite máximo seguro, ex.: 100).  
    - Retornar metadados de paginação (total, pageSize, currentPage).  
    - Usar `orderBy` consistente para resultados determinísticos.

- **Criar camada de serviços/repositórios para encapsular acesso ao Prisma**  
  - Atualmente boa parte das rotas acessa `prisma` diretamente e repete lógica de
    `tenantId`, filtros por status, include de relações e contagens.  
  - Centralizar em serviços, por exemplo:  
    - `casesService.listByTenant(...)`, `clientsService.search(...)`, etc.  
  - Benefícios:  
    - Reduz duplicação de código.  
    - Facilita otimizações de queries em um único lugar.  
    - Ajuda na criação de testes unitários.

- **Padronizar tratamento de erros e logs**  
  - Hoje há blocos `try/catch` espalhados com `console.error` simples em diversas
    rotas de API.  
  - Sugestões:  
    - Criar um utilitário de erro (ex.: `createApiErrorResponse`) para padronizar
      `NextResponse.json` com `message`, `code`, `details`.  
    - Adicionar correlação (request id, tenant id, user id) nos logs para facilitar
      depuração.  
    - Integrar com plataforma de log/monitoramento (ex.: Logtail, DataDog, Grafana Loki).

- **Otimizar RBAC e sincronização com tabela `Role`**  
  - O arquivo `src/lib/rbac.ts` mantém um mapa estático de permissões por `role`,
    enquanto o schema Prisma possui o modelo `Role` com `permissions` em JSON.  
  - Isso pode gerar divergência entre permissão real (banco) e permissão usada na
    aplicação.  
  - Sugestões:  
    - Definir uma estratégia única: ou 100% baseado no banco (`Role`), ou 100%
      estático, evitando duplicidade.  
    - Expor um endpoint/config interna para administração de permissões por tenant.

- **Revisar uso de `getServerSession` em rotas de API**  
  - Cada rota chama `getServerSession(authOptions)` individualmente.  
  - Em cenários de alta concorrência, isso adiciona overhead.  
  - Possíveis melhorias:  
    - Extrair helper (`getAuthenticatedUserOrThrow`) para unificar validação e
      logging de autenticação.  
    - Avaliar cache leve do resultado no contexto da requisição (quando possível).

- **Timeouts e limites de payload**  
  - Para rotas potencialmente pesadas (ex.: geração de PDFs, upload de documentos,
    envio de e-mails), é importante garantir timeouts de operação e validação do
    tamanho de payload para evitar uso abusivo de recursos.

## 3. Envio de e-mails e tarefas assíncronas

- **Desacoplar envio de e-mails da requisição HTTP**  
  - A rota `src/app/api/alerts/send-email/route.ts` indica envio de e-mails direto
    a partir da requisição.  
  - Em cenários de pico (ex.: lembretes de prazos para muitos clientes), isso pode
    degradar o tempo de resposta e levar a timeouts.
  - Sugestões:  
    - Introduzir uma fila de jobs (ex.: Redis + BullMQ ou serviço gerenciado).  
    - API grava o job na fila; um worker separado envia o e-mail.  
    - Persistir logs de envio (sucesso, falha, tentativas) para auditoria.

- **Centralizar configuração de transporte de e-mail**  
  - `src/lib/mailer.ts` pode ser ampliado para:  
    - Suportar múltiplos providers (SMTP, API, etc.).  
    - Adicionar retries com backoff exponencial.  
    - Medir latência e falhas por provedor.

## 4. Frontend (Next.js App Router / React)

- **Padronizar camada de consumo de API no frontend**  
  - Diversos componentes clientes (`'use client'`) usam `useEffect` + `fetch` direto
    para busca de dados (ex.: `document-list`, `deadline-list`, `calendar-view`,
    `activity-timeline`, `task-kanban`).  
  - Sugestões:  
    - Criar uma camada de serviços de API no frontend (`src/lib/api` ou hooks
      especializados).  
    - Avaliar uso de uma biblioteca de data fetching com cache, revalidação e
      deduplicação (ex.: SWR ou React Query).  
    - Tratar estados de loading/erro de forma consistente entre telas.

- **Dividir componentes muito grandes em subcomponentes**  
  - Arquivos como `src/components/documents/document-list.tsx` (~400+ linhas) e
    `src/components/documents/document-upload.tsx` são candidatos a refatoração:  
    - Extrair componentes menores (filtros, tabela, barra de ações, diálogos).  
    - Facilitar reuso, testes e otimização local de performance.  
    - Reduzir re-renderizações ao memorizar subárvores estáveis.

- **Virtualização de listas pesadas**  
  - Tabelas de documentos, faturas, prazos e transações podem crescer bastante.  
  - Para grandes volumes, implementar virtualização de lista (ex.: `react-virtual`
    ou similar) para renderizar apenas o que está visível.  
  - Benefícios:  
    - Menor uso de memória.  
    - Melhor tempo de renderização e scroll fluido.

- **Otimização de bundles e carregamento condicional**  
  - O projeto utiliza bibliotecas como `date-fns`, `lucide-react`, `recharts` e
    componentes complexos de UI.  
  - Sugestões:  
    - Usar imports específicos em `date-fns` (já em parte aplicado) e evitar
      reexportar tudo em utilitários globais.  
    - Carregar gráficos (`recharts`) via import dinâmico (`next/dynamic`) para não
      impactar o tempo de carregamento inicial.  
    - Considerar lazy loading de módulos de menor uso (ex.: faturamento, financeiro).

- **Aproveitar server components para dados somente leitura**  
  - Boa parte das páginas de dashboard são fortemente baseadas em leitura de dados.  
  - Avaliar mover partes dessas telas para Server Components, reduzindo a quantidade
    de JavaScript enviado ao cliente e tirando proveito de data fetching no servidor.

## 5. Segurança e controle de acesso

- **Endurecer middleware de autorização**  
  - `src/middleware.ts` já protege `/dashboard` e `/api/settings`, mas:  
    - Outras rotas de API validam permissões manualmente (ex.: `cases/[id]/route.ts`
      com `can`/`canAsync`).  
    - É possível centralizar políticas para reduzir chances de inconsistência.  
  - Sugestões:  
    - Criar helpers como `requirePermission('cases.view')` para uso nas rotas.  
    - Consolidar checagens de `tenantId` e ownership em funções reutilizáveis.

- **Validação e sanitização de entrada mais rigorosa**  
  - O uso de `zod` já está bem presente, o que é positivo.  
  - Pontos de melhoria:  
    - Normalizar campos de busca (`search`) para evitar consultas case-sensitive
      inesperadas.  
    - Limitar tamanho máximo de strings em campos livres (observações, descrições).  
    - Garantir que IDs recebidos por parâmetro sempre pertençam ao `tenantId` do
      usuário logado.

- **Proteção extra para ações críticas**  
  - Operações como exclusão de documentos, faturas, transações financeiras e
    alteração de configurações do tenant podem receber:  
    - Confirmação explícita no frontend (diálogo de confirmação).  
    - Auditoria detalhada na tabela `AuditLog` (já existente, mas pode ser mais
      amplamente utilizada em todas rotas críticas).

## 6. Observabilidade, logs e métricas

- **Introduzir monitoração de performance end-to-end**  
  - Recomendações:  
    - Configurar tracing (OpenTelemetry) para medir:  
      - Latência por rota de API.  
      - Latência de queries Prisma.  
      - Erros por tipo/rota/tenant.  
    - Integrar com um APM (Application Performance Monitoring) compatível.

- **Dashboards de negócios e saúde do sistema**  
  - Criar painéis agregando métricas como:  
    - Tempo médio de resposta por módulo (CRM, Processos, Financeiro).  
    - Número de erros por dia/tenant.  
    - Volume de e-mails enviados e falhas.

## 7. Testes e qualidade

- **Adicionar suíte de testes automatizados**  
  - Atualmente não há uma estrutura de testes visível no projeto.  
  - Sugestões:  
    - Testes unitários para utilitários (`src/lib/utils.ts`, formatações, RBAC).  
    - Testes de integração para rotas de API críticas (autenticação, casos,
      clientes, faturamento, financeiro).  
    - Testes E2E para fluxos principais (login, criação de cliente, abertura de
      processo, lançamento de horas, emissão de fatura, registro de pagamento).

- **Configurar checks de qualidade no CI**  
  - Rodar `npm run lint` e futuramente `npm test`/`npm run test:e2e` em cada push.  
  - Habilitar verificação de tipos (`tsc --noEmit`) em pipeline.

## 8. Performance e escalabilidade futura

- **Limites e quotas por tenant**  
  - Para manter performance isolada entre escritórios (tenants), definir limites como:  
    - Máximo de documentos armazenados por tenant (com planos diferenciados).  
    - Máximo de requisições por minuto (rate limiting) nas rotas mais sensíveis.  
  - Implementar rate limiting em rotas públicas/autenticadas mais críticas.

- **Cache de consultas frequentemente usadas**  
  - Prazos próximos, agenda diária, indicadores de financeiro e faturamento podem
    ser cacheados por janela curta (ex.: 30–60 segundos) por tenant.  
  - Opções:  
    - Cache em memória no servidor (para poucas instâncias).  
    - Cache distribuído via Redis em ambientes escalados.

- **Preparar o projeto para múltiplas instâncias**  
  - Com a migração para Postgres e uso de fila, será mais simples escalar o app.  
  - Garantir que não existam estados globais mutáveis no código (além da instância
    compartilhada de `PrismaClient`).  
  - Validar que uploads e arquivos em `public/uploads` estejam em storage externo
    (S3, GCS, etc.) em ambientes distribuídos.

---

Estas melhorias podem ser implementadas de forma incremental. Uma ordem sugerida:

1. Migração de banco de dados para Postgres e criação de índices.  
2. Paginação e otimizações de queries nas principais rotas de API.  
3. Refatoração dos componentes mais pesados do frontend e adoção de camada de
   data fetching padronizada.  
4. Introdução de fila para e-mails e tarefas assíncronas.  
5. Implementação de monitoração, testes automatizados e ajustes finos de segurança.

