# Walkthrough - Módulo de Leads e Pipeline CRM

Este documento descreve as novas funcionalidades implementadas no módulo de CRM referente à gestão de Leads e Pipeline de Vendas.

## Novas Funcionalidades

### 1. Pipeline de Leads (Kanban)
**Caminho:** `/dashboard/crm/leads`

Implementamos um quadro **Kanban** visual para gerenciar seus leads através de diferentes estágios:
*   **Novos:** Leads recém-chegados.
*   **Qualificados:** Leads que demonstraram interesse e potencial.
*   **Proposta Enviada:** Leads que receberam uma proposta formal.
*   **Em Negociação:** Em fase de ajustes finais.

**Funcionalidades do Kanban:**
*   **Visualização Rápida:** Cards com Nome, Email, Telefone e tempo desde a última atualização.
*   **Movimentação:** Botão "Avançar" para mover rapidamente para o próximo estágio ou menu de opções (três pontos) para mover para qualquer estágio.
*   **Conversão:** Marque um lead como **Ganho** para convertê-lo automaticamente em um **Cliente Ativo**.
*   **Arquivamento:** Marque como **Perdido** para arquivar.

### 2. Cadastro de Leads
**Caminho:** Botão "Novo Lead" em `/dashboard/crm/leads` ou no formulário de Cliente.

O formulário de clientes foi atualizado para suportar o status "Lead".
*   Ao criar um novo Lead, você pode definir seu estágio inicial (ex: Novo, Qualificado).
*   Você pode capturar informações básicas (Nome, Contato) e enriquecer depois.

### 3. Integração com Clientes
A base de dados é unificada. Um Lead é tecnicamente um `Client` com `status="lead"`.
*   Isso significa que ao converter um lead (Ganho), ele mantém todo o histórico sem necessidade de migração de dados.
*   O campo `leadStage` controla a coluna no Kanban.

## Módulo de Processos (Cases)

Agora você também pode gerenciar processos jurídicos vinculados aos seus clientes.

### 1. Criar um Processo
**Caminho:** `/dashboard/cases` > Botão "Novo Processo"

*   Preencha o Título (ex: "Ação Trabalhista vs Empresa X").
*   Selecione o **Cliente** (pesquisável).
*   Defina a **Área de Prática** e **Status**.
*   (Opcional) Adicione Nº do Processo, Tribunal, Comarca, etc.

### 2. Detalhes do Processo
Clique em "Abrir" na lista de processos para ver o painel detalhado.
*   **Visão Geral:** Resumo dos dados, cliente vinculado e advogado responsável.
*   **Abas Futuras:** Prazos e Audiências já disponíveis!

### 3. Prazos e Audiências
Dentro do detalhe do processo:
*   **Prazos:** Adicione datas limites para contestação, recursos, etc. Marque como concluído com um clique.
*   **Audiências:** Agende audiências informando data, local (ou link) e tipo.

### 4. Gestão de Documentos (GED)
*   **Abas de Documentos:** Arraste e solte arquivos PDF, Word ou imagens.
*   **Armazenamento:** Os arquivos são salvos localmente na pasta `public/uploads`.
*   **Ações:** Baixe ou visualize clicando no nome.

## Calendário e Prazos (NOVO)

Agora você tem uma visão centralizada de todos os compromissos do escritório.

### 1. Visão Geral Mensal
**Caminho:** `/dashboard/calendar` (ou clique em "Calendário" no menu lateral)

O calendário exibe **Prazos** (Cores quentes: Laranja/Vermelho) e **Audiências** (Cores frias: Azul/Roxo) de forma unificada.
*   **Navegação:** Use as setas para trocar de mês.
*   **Detalhes:** Clique em qualquer evento para ir direto para o Processo (Case) relacionado.

### 2. Prazos
Os prazos cadastrados dentro dos processos aparecem automaticamente aqui.
*   Prazos vencidos ou próximos do vencimento seguem a mesma lógica visual.
*   Ao concluir um prazo no processo, ele aparecerá com visual "concluído" (esmaecido) no calendário.

### 3. Audiências
As audiências agendadas também são sincronizadas.
*   Exibe horário e local (se houver).

## Como Testar
1.  Acesse **CRM / Pipeline** no menu lateral.
2.  Clique em **Novo Lead** e cadastre alguém.
3.  Veja o card aparecer na coluna "Novos" (ou a que você escolheu).
4.  Clique em **Avançar** no card para movê-lo para "Qualificados".
5.  Abra o menu do card e escolha "Marcar como Ganho".
6.  Verifique que o card sumiu do Kanban.
7.  Vá em **CRM / Clientes** e verifique que ele agora aparece na lista de clientes ativos.
