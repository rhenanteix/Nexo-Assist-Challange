# Nexo Assist — React + TypeScript

Aplicação demonstrativa construída a partir do arquivo `nexo.pen`, contendo seis fluxos de tela: login, chat de abertura de chamado, consulta e transferência, lista de conversas do atendente, atendimento assumido e perfil.

## Executar

Requer Node.js 20.19+ (ou 22+).

```bash
npm install
npm run dev
```

Acesse a URL indicada pelo Vite (normalmente http://localhost:5173).

## Funcionalidades

- Login demonstrativo com validação básica (qualquer e-mail válido e senha de pelo menos 4 caracteres).
- Chat guiado por regras, abertura e consulta de chamados, opções de afetados e confirmação de rascunho.
- Transferência simulada para o painel do atendente.
- Painel com pesquisa, filtros, assumir, responder, devolver e encerrar atendimento.
- Perfil e navegação entre as telas.
- Persistência de sessão, chamados e mensagens no `localStorage` do navegador.

## Limites da demonstração

Não há servidor, autenticação real, integração com Active Directory, IA, envio de e-mails, SLA calculado ou sincronização entre usuários. A recuperação de senha é apenas ilustrativa. Para produção, integrar API segura, autenticação e banco de dados. Não utilizar este login demonstrativo para credenciais reais.

## Estrutura

- `src/main.tsx`: aplicação, estado e fluxos.
- `src/style.css`: layout responsivo e identidade visual.
- `index.html`: entrada do Vite.
