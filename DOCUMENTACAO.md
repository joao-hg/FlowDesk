# FLowsDesk - Documentação do Projeto

## Token e Integração
- **Notion Token:** Configurado via arquivo `.env` (variável `NOTION_TOKEN`) para evitar exposição no GitHub.
- **Repositório GitHub:** Inicializado localmente.

## Resumo do Projeto: FlowDesk
Plataforma de gestão de solicitações e processos internos B2B. A plataforma visa centralizar demandas, responsáveis, SLA, histórico e indicadores operacionais para evitar perda de contexto e melhorar a visibilidade corporativa.

### Arquitetura e Stack
- **Frontend:** Next.js + TypeScript + TailwindCSS + shadcn/ui
- **Backend:** Node.js + TypeScript (REST API)
- **Banco de Dados:** PostgreSQL + Prisma (ORM)
- **Autenticação:** Auth.js

### Roadmap - Fase 1 (MVP)
- [ ] Login e Autenticação
- [ ] CRUD de Usuários e Equipes
- [ ] CRUD de Solicitações, Status, Categorias e Prioridades
- [ ] Dashboard Básico

## Histórico de Atividades

### [11/08/2026] - Inicialização e Integração
- Lida a documentação do projeto (`FlowDesk_Projeto_de_Portfolio.pdf`).
- Inicializado repositório Git no diretório `/home/joao/Projetos/FLowsDesk`.
- Configurado remote do GitHub: `https://github.com/joao-hg/FlowDesk.git`.
- Criado o script `sync_notion.js` para integração automática com a base de dados do Notion.
- Criado executável `sync.sh` para facilitar o fluxo de sincronização contínua com Notion e GitHub.
