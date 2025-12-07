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
*   � **Detalhes com Prazos e Audiências**: Concluído (`src/app/dashboard/cases/[id]/page.tsx`, `src/app/api/cases/[id]/deadlines/route.ts`, `src/app/api/cases/[id]/hearings/route.ts`).
*   �🔴 **Gestão de Tarefas (Task Management)**: Essencial. Falta aba de tarefas e quadro Kanban.
*   🔴 **Automação de Workflow**: Regras de transição de fase.
*   🔴 **Checklists**: Modelos de tarefas por tipo de ação.

## 3. Calendário e Prazos 📅
*   🟢 **Calendário Central**: Concluído (`src/app/dashboard/calendar/page.tsx`, `src/app/api/calendar/events/route.ts`).
*   🟢 **Gestão de Prazos**: Concluído (`src/app/dashboard/deadlines/page.tsx`, `src/app/api/deadlines/route.ts`).
*   🔴 **Alertas/Notificações**: Email ou Push para prazos e audiências.
*   🔴 **Integração Externa**: Sincronização com Google/Outlook.

## 4. Gestão de Documentos (GED) 📂
*   🟢 **Upload e Listagem**: Concluído (`src/app/api/documents/route.ts`, `src/components/documents/document-upload.tsx`, `src/components/documents/document-list.tsx`).
*   🔴 **Modelos (Templates)**: Criação de documentos a partir de variáveis.
*   🔴 **Versionamento**: Histórico de edições.
*   🔴 **Assinatura Digital**: Integração (ClickSign/DocuSign).

## 5. Faturamento e Time Tracking ⏱️
*   🟢 **Time Tracking (Lançamento de Horas)**: Concluído (`src/app/dashboard/time-tracking/page.tsx`, `src/app/api/billing/time-entries/route.ts`).
*   � **Faturas (Invoices)**: Concluído (geração a partir das horas) (`src/app/dashboard/billing/page.tsx`, `src/app/dashboard/billing/new/page.tsx`, `src/app/api/billing/invoices/route.ts`).
*   🔴 **Pagamentos de Faturas**: Registro de recebimentos.
*   🔴 **Controle de Honorários**: Fixos, mensais ou êxito.

## 6. Financeiro (ERP) 💰
*   � **Contas a Pagar/Receber**: Gestão básica (parcial) (`src/app/finance/transactions/page.tsx`, `src/app/api/finance/transactions/route.ts`).
*   � **Fluxo de Caixa**: KPI mensais (parcial) (`src/app/dashboard/finance/page.tsx`, `src/app/api/finance/dashboard/route.ts`).
*   🔴 **Conciliação Bancária**.

## 7. Sistema e Configurações ⚙️
*   🔴 **Perfil do Usuário**: Edição de dados e senha.
*   🔴 **Configurações do Escritório**: Logo, dados para rodapé de documentos.
*   � **Gestão de Usuários**: Convites e listagem (parcial) (`src/app/dashboard/settings/users/page.tsx`, `src/app/api/settings/users/route.ts`, `src/app/api/settings/users/invite/route.ts`).

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

1.  **Financeiro**: Implementar pagamentos de faturas e consolidar lançamentos (A/R).  
2.  **Gestão de Tarefas (Cases)**: Aba de tarefas + quadro Kanban por processo.  
3.  **Documentos**: Templates com variáveis e versionamento básico.  
4.  **Alertas/Notificações**: Email/Push para prazos e audiências.  
5.  **RBAC & Configurações**: Permissões por papel e configurações do escritório.  
6.  **Integrações**: Sincronização com Google/Outlook (calendário) e preparação para gateways de pagamento.
