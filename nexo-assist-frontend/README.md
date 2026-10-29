# Nexo Assist — Frontend

Frontend React + TypeScript do protótipo Nexo Assist. **Demo local, sem backend nem autenticação real.**

## Executar

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run dev
```

## Qualidade

```bash
npm run typecheck
npm run lint
npm run format:check
npm run format
npm run build
```

## Organização

- `src/app`: roteamento e composição da aplicação
- `src/pages`: telas (login, chat, painel do atendente, perfil)
- `src/components`: componentes de interface reutilizáveis
- `src/domain`: tipos e contratos de domínio
- `src/store`: estado da demonstração com Zustand e persistência no localStorage
- `src/data`: dados fictícios para demonstração
- `src/shared`: utilitários
- `src/styles`: CSS global do protótipo

## Limitações importantes

- Login simulado (não enviar senhas reais); nenhuma senha é persistida.
- Mensagens, chamados e atendimentos ficam **somente no navegador atual**.
- O fluxo de transferência não é sincronizado com um backend.
- Prioridade, status e respostas são simulados; não representam SLAs reais.
- `@tanstack/react-query` já está configurado para futura camada HTTP; ainda não há endpoints reais definidos.

## Próximos passos para produção

Integrar API com contratos versionados, autenticação OIDC, RBAC cliente/atendente, validação server-side, testes de integração e E2E, eventos em tempo real e tratamento de falhas.
