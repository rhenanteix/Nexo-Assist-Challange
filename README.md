# Nexo Assist — Monorepo React + NestJS

Frontend React/TypeScript/Vite e backend NestJS/Prisma/SQLite para o desafio técnico. **Versão de demonstração integrada**, não homologada para produção.

## Requisitos
Node.js 20+ e npm. SQLite é criado automaticamente pelo Prisma; não é necessário Docker.

## Inicialização
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm install
npm run prisma:setup -w backend
npm run dev
```

API: http://localhost:3001/api · Swagger: http://localhost:3001/docs · Web: http://localhost:5173

Contas de exemplo: `ana@nexo.com.br`, `bruno@nexo.com.br` e `analista@nexo.com.br`; qualquer senha não vazia (apenas para o desafio). A base persiste em `backend/prisma/dev.db`.

## Arquitetura
- `frontend/src/api`: cliente HTTP tipado e sessão; páginas de login, chat, console e perfil conectadas à API.
- `backend/src/auth.ts`: login demonstrativo, JWT e autorização por papel.
- `backend/src/tickets.ts`: serviço independente de chamados, propriedade do usuário, verificação simples de duplicidade, criação e atualização.
- `backend/src/conversations.ts`: persistência de mensagens e estado, fila, atribuição, devolução e encerramento; bloqueio do agente durante atendimento humano.
- `backend/src/agent.ts`: decisões auditadas e pesquisa na central de ajuda. Opcionalmente usa OpenAI para classificação JSON, com fallback determinístico quando a chave não estiver definida.
- `backend/prisma`: modelo relacional e seed idempotente.

## Decisões, qualidade e limitações
A classificação retorna intenção, categoria, prioridade, tipo, confiança e justificativa; os metadados são salvos em `Audit` e expostos na conversa. Criar chamado requer confirmação explícita. A API protege tickets por `ownerId` e diferencia analista de funcionário.

**Limitações conhecidas:** ainda não utiliza Mastra/LangGraph; classificação LLM é direta e opcional; cálculo de SLA usa horas corridas (não horas úteis); deduplicação por título exato; confirmação por API não é transacional/idempotente sob concorrência; não há atualização em tempo real via WebSocket (console usa polling de 5s); não há testes E2E, nem rate limit por usuário, nem circuit breaker para legado. A autenticação com qualquer senha é **somente demonstração**, nunca deve ser usada em produção. Não publicar sem corrigir esses pontos.

## Comandos
```bash
npm run format
npm run build
npm run test
npm run typecheck -w backend
```

## Próximas etapas
Mastra com ferramentas tipadas, SLA de dias úteis, confirmação transacional, Socket.IO, logs estruturados, testes de contrato/E2E, Docker Compose e pipeline CI.


## Revisão: SLA, resiliência e WebSocket

Leia [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) para funcionalidades implementadas, lacunas e validações pendentes. A comunicação Socket.IO usa JWT no handshake, namespace `/events` e notificação `conversation:changed` sem conteúdo sensível.

Para simular falha do legado, configure `SIMULATE_LEGACY_OUTAGE=true` no backend. O cálculo de SLA usa `America/Sao_Paulo`, dias úteis de segunda a sexta das 08h às 18h, sem feriados, exceto prioridade crítica (24/7).

## Atualização: agente Mastra, idempotência, outbox e testes

- `AGENT_PROVIDER=mastra` e `OPENAI_API_KEY` habilitam classificação estruturada por Mastra (`backend/src/mastra-classifier.ts`). A ausência de chave ativa fallback determinístico.
- A confirmação do chamado ocorre em uma transação e cada rascunho pode ser confirmado uma única vez (`TicketOperation`).
- Eventos de alteração são persistidos em `OutboxEvent` e entregues via Socket.IO por `OutboxService`. A UI deve refazer GET da conversa ao receber `conversation:changed`.
- Executar `npm run test -w backend` e `npm run test:e2e -w backend` depois de instalar dependências.
- Antes do primeiro uso do banco atualizado, executar `npm run prisma:setup -w backend`.

**Atenção:** a instalação, compilação e execução dos testes não puderam ser concluídas neste ambiente por indisponibilidade de DNS do registro npm. Leia `IMPLEMENTATION_STATUS.md` antes de apresentar o projeto como concluído.
