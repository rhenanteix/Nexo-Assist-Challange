# Nexo Assist — Status de engenharia (03/11/2026)

## Código implementado nesta revisão

- Adaptador Mastra com validação de saída por Zod e fallback local quando o modelo não está disponível.
- Confirmação de rascunho com transação Prisma, `TicketOperation.draftId` único e trilha de auditoria.
- Outbox persistente para eventos de conversa; despachante com retry e semântica *at-least-once*.
- Testes de contrato HTTP para JWT e validação, testes unitários do outbox.
- Documentação de execução, cenários de teste e limitações.

## Limitações e validações obrigatórias

1. **Build e testes não executados:** o npm registry retornou `EAI_AGAIN` neste ambiente. A versão do Mastra e a assinatura da API `Agent.generate` devem ser verificadas contra a versão instalada; pode ser necessário adaptar a integração.
2. **Sem homologação E2E no navegador:** os testes HTTP foram escritos, mas não executados; não existe suíte Playwright completa.
3. **Outbox de instância única:** o despachante não possui lease/claim distribuído. Em múltiplas réplicas, eventos podem ser emitidos mais de uma vez. O cliente deve refazer a leitura da conversa após cada evento.
4. **Deduplicação de chamados concorrentes:** a confirmação é idempotente por rascunho, mas confirmações de rascunhos diferentes sobre o mesmo problema ainda podem concorrer. Para produção, adicionar fingerprint único por usuário/assunto ativo e transação com retry.
5. **Serviço legado:** a confirmação transacional grava diretamente no banco simulado, não por adaptador externo. Uma integração real exigirá saga/outbox e idempotency key no legado.
6. **Segurança:** login demonstrativo com qualquer senha conforme o PRD; não usar em produção. JWT_SECRET deve ser definido fora do código.

**Não declarar o projeto homologado ou pronto para produção antes de executar e corrigir os testes e de validar os fluxos de ponta a ponta.**
