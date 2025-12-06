# Relatório de Pendências de Implementação

Este documento lista as funcionalidades que constam no planejamento (`Document/task.md` e `Document/status_implementacao.md`) mas que **ainda não foram encontradas na base de código atual**.

## 1. CRM & Clientes 👥
*   **Automação de Roteamento de Leads**: Planejado ("Lead routing automation"), mas não implementado.
*   **Sistema de Pontuação (Lead Scoring)**: Planejado, sem evidência de implementação.

## 2. Processos (Cases) ⚖️
Embora o cadastro e listagem básica existam, faltam submódulos críticos:
*   **Gestão de Tarefas (Task Management)**: Planejado ("Create task management system", "Kanban board"). Não há aba de Tarefas no detalhe do processo.
*   **Gestão de Petições**: Planejado (" Create petition management"). Inexistente.
*   **Timeline Visual**: Planejado ("Case timeline/activity feed"). Existe histórico básico, mas não uma timeline visual interativa.
*   **Modelos de Checklist**: Planejado ("Build case checklist templates"). Não implementado.
*   **Fluxo de Status do Processo**: Planejado ("Implement case status workflow"). O status existe como campo simples, sem regras de transição.

## 3. Documentos (GED) 📂
Implementamos Upload e Listagem, mas faltam itens avançados do plano:
*   **Gestão de Modelos (Templates)**: Planejado ("Build template library system", "Template editor"). A rota `/dashboard/documents/templates` não existe.
*   **Versionamento de Documentos**: Planejado ("Implement document versioning"). O banco suporta (schema), mas não há UI para ver/restaurar versões antigas.
*   **Assinatura Digital**: Planejado ("Implement digital signature integration"). Não iniciado.
*   **Busca com OCR**: Planejado. Não iniciado.

## 4. Calendário e Prazos 📅
*   **Calendário Central**: Planejado ("Build central calendar interface"). Atualmente os prazos e audiências aparecem apenas dentro dos processos. Falta uma visão geral mensal/semanal (`/dashboard/calendar`).
*   **Sistema de Alertas/Notificações**: Planejado. Não há sistema de notificações (email/push) ativo para prazos próximos.
*   **Integração (Google/Outlook)**: Planejado. Não iniciado.

## 5. Financeiro e Faturamento 💰
*   **Módulo Completo Pendente**: Todo o módulo financeiro (Time Tracking, Faturas, Pagamentos, Relatórios) consta como planejado mas está **0% implementado**.

## Resumo das Prioridades Faltantes
Sugiro focar na seguinte ordem para fechar o MVP funcional:
1.  **Calendário Central**: Essencial para a rotina do advogado.
2.  **Gestão de Tarefas nos Processos**: Para delegar atividades além de prazos judiciais.
3.  **Modelos de Documentos**: Para agilizar a produção jurídica.
