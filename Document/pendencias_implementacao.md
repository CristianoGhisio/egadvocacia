# Relatório de Pendências de Implementação

Este documento lista as funcionalidades planejadas que **ainda não implementadas** na base de código, priorizadas logicamente para conclusão do MVP.

**Legenda**:
*   🟢 = Implementado
*   🟡 = Em Andamento / Parcial
*   🔴 = Pendente / Não Iniciado

---

## 1. CRM & Clientes 👥
*   🟢 **Listagem e Detalhes**: Concluído (`src/app/dashboard/crm/clients/page.tsx`).
*   🟢 **Histórico e Interações**: Concluído (`src/app/api/crm/clients/[id]/interactions/route.ts`).
*   🟢 **Gestão de Leads (Pipeline)**: Concluído (`src/components/crm/lead-kanban.tsx`).
*   🔴 **Automação de Roteamento**: Não iniciado.
*   🔴 **Scoring de Leads**: Não iniciado.

## 2. Processos (Cases) ⚖️
*   🟢 **Cadastro e Listagem**: Concluído (`src/app/dashboard/cases/page.tsx`, `src/app/api/cases/route.ts`).
*   🟢 **Detalhes com Prazos e Audiências**: Concluído (`src/app/dashboard/cases/[id]/page.tsx:161`, `src/app/api/cases/[id]/deadlines/route.ts:1`, `src/app/api/cases/[id]/hearings/route.ts`).
*   � **Gestão de Tarefas (Task Management)**: Concluído (`src/components/cases/task-kanban.tsx:25`, `src/app/api/cases/[id]/tasks/route.ts:41`).
*   🔴 **Automação de Workflow**: Regras de transição de fase.
*   🔴 **Checklists**: Modelos de tarefas por tipo de ação.

## 3. Calendário e Prazos 📅
*   🟢 **Calendário Central**: Concluído (`src/app/dashboard/calendar/page.tsx`, `src/app/api/calendar/events/route.ts:54`).
*   🟢 **Gestão de Prazos**: Concluído (`src/app/dashboard/deadlines/page.tsx:9`, `src/app/api/deadlines/route.ts`).
*   🔴 **Alertas/Notificações**: Email ou Push para prazos e audiências.
*   🔴 **Integração Externa**: Sincronização com Google/Outlook.

## 4. Gestão de Documentos (GED) 📂
*   🟢 **Upload e Listagem**: Concluído (`src/app/api/documents/route.ts`, `src/components/documents/document-upload.tsx`, `src/components/documents/document-list.tsx`).
*   � **Modelos (Templates)**: Concluído (API de criação e geração com variáveis) (`src/app/api/documents/templates/route.ts:33`, `src/app/api/documents/templates/[id]/generate/route.ts:1`, UI em `src/components/documents/document-list.tsx:221`).
*   � **Versionamento**: Concluído (API + UI de versões) (`src/app/api/documents/[id]/versions/route.ts:26`, `src/components/documents/document-list.tsx:338`).
*   🔴 **Assinatura Digital**: Integração (ClickSign/DocuSign).

## 5. Faturamento e Time Tracking ⏱️
*   🟢 **Time Tracking (Lançamento de Horas)**: Concluído (`src/app/dashboard/time-tracking/page.tsx`, `src/app/api/billing/time-entries/route.ts`).
*   🟢 **Faturas (Invoices)**: Concluído (geração a partir das horas) (`src/app/dashboard/billing/page.tsx:10`, `src/app/dashboard/billing/new/page.tsx:31`, `src/app/api/billing/invoices/route.ts:15`).
*   � **Pagamentos de Faturas**: Concluído (registro de recebimentos e lançamento financeiro) (`src/components/billing/invoice-list.tsx:75`, `src/app/api/billing/invoices/[id]/payment/route.ts:14`).
*   🔴 **Controle de Honorários**: Fixos, mensais ou êxito.

## 6. Financeiro (ERP) 💰
*   🟡 **Contas a Pagar/Receber**: Gestão básica (parcial) (`src/app/dashboard/finance/page.tsx:39`, `src/app/api/finance/transactions/route.ts:16`).
*   🟡 **Fluxo de Caixa**: KPI mensais (parcial) (`src/app/dashboard/finance/page.tsx:39`, `src/app/api/finance/dashboard/route.ts:7`).
*   🔴 **Conciliação Bancária**.

## 7. Sistema e Configurações ⚙️
*   🔴 **Perfil do Usuário**: Edição de dados e senha.
*   🔴 **Configurações do Escritório**: Logo, dados para rodapé de documentos.
*   🟡 **Gestão de Usuários**: Convites e listagem (parcial) (`src/app/dashboard/settings/users/page.tsx`, `src/app/api/settings/users/invite/route.ts:14`).

## 8. Relatórios & BI �
*   🔴 **Relatórios Financeiros e Operacionais**: DRE, aging de faturas, produtividade.

## 9. Portal do Cliente 🔐
*   🔴 **Área do Cliente**: Acesso a processos, documentos e faturas; pagamentos.

## 10. Workflow & Automação 🔄
*   🔴 **Designer de Workflow e Regras**: Automação de tarefas e SLAs.

## 11. Integrações & APIs 🔌
*   🔴 **Calendários (Google/Outlook)**, **Gateways de Pagamento**, **Assinatura Digital**, **ERPs Contábeis**.

## 12. Compliance & Riscos ✅
*   🔴 **LGPD, Auditoria e Logs**, **Controle de Conflitos**.

## 13. Monitoramento de Tribunais 🏛️
*   🔴 **Robôs/Integrações**: Andamentos automáticos, captura de intimações.

## 14. Contratos (CLM) 📜
*   🔴 **Templates, Versionamento e Alertas de Renovação**.

## 15. RH & Produtividade 👥
*   🔴 **Perfis, Alocação por Caso, Timesheets e KPIs**.

---

## 🚀 Próximos Passos (Ordem Lógica)

Alinhado ao MVP em `Document/referencia.md` (CRM + Cases + Documentos + Prazos + Billing):

1.  **Alertas/Notificações**: Email/Push para prazos e audiências + escalonamento.
2.  **Calendário**: Integração com Google/Outlook e sincronização bidirecional.
3.  **RBAC & Configurações**: Permissões por módulo/ação/campo, políticas de senha e dados do escritório.
4.  **Financeiro (A/R & A/P)**: Aprimorar contas a receber/pagar (filtros, categorias, reconciliação futura).
5.  **Workflow & Checklists**: Checklists por tipo de ação e automações básicas de transição.
6.  **Integrações de Pagamento**: Preparar gateway (Pix/Boleto/Cartão) e base para Portal do Cliente.
