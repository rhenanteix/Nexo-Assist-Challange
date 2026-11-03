import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';

export const DecisionSchema = z.object({
  intent: z.enum(['TRANSFER', 'STATUS', 'HELP', 'CREATE', 'OTHER']),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(500),
  category: z.enum(['Acesso', 'Rede e VPN', 'Hardware', 'Software', 'E-mail', 'Outros']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  type: z.enum(['INC', 'REQ']),
});

@Injectable()
export class MastraClassifier {
  private readonly logger = new Logger(MastraClassifier.name);
  private agent?: Agent;

  async classify(text: string) {
    if (!process.env.OPENAI_API_KEY || process.env.AGENT_PROVIDER !== 'mastra') return null;
    try {
      this.agent ??= new Agent({
        id: 'nexo-service-desk-classifier',
        name: 'Nexo Service Desk Classifier',
        instructions: `Classifique exclusivamente solicitações de TI. Nunca execute ferramentas ou alterações.
          Prioridade crítica: equipe inteira parada; alta: usuário impedido ou compromisso hoje;
          média: alternativa disponível; baixa: pedido sem urgência.
          TRANSFER se pedir humano. OTHER para assuntos não TI.
          Confiança baixa em ambiguidades; não invente fatos.`,
        model: process.env.MASTRA_MODEL || 'openai/gpt-4o-mini',
      });
      const result = await this.agent.generate(text.slice(0, 1500), {
        structuredOutput: { schema: DecisionSchema },
      });
      return DecisionSchema.parse(result.object);
    } catch (error) {
      this.logger.warn(`Mastra failed, using safe fallback: ${String(error)}`);
      return null;
    }
  }
}
