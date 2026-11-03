import { MastraClassifier } from './mastra-classifier';
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TicketsService, TicketDto } from './tickets';
import { Principal } from './auth';
import OpenAI from 'openai';
import { isOverdue } from './sla';
type Decision = {
    intent: 'TRANSFER' | 'STATUS' | 'HELP' | 'CREATE' | 'OTHER';
    confidence: number;
    reason: string;
    category: string;
    priority: string;
    type: string;
};
@Injectable()
export class AgentService {
    constructor(private db: PrismaService, private tickets: TicketsService, private mastra: MastraClassifier) { }
    private heuristic(text: string): Decision {
        const s = text.toLowerCase();
        const category = /vpn|internet|rede|wifi/.test(s) ? 'Rede e VPN' : /notebook|monitor|computador|teclado/.test(s) ? 'Hardware' : /senha|acesso|login/.test(s) ? 'Acesso' : /email|e-mail|outlook/.test(s) ? 'E-mail' : 'Software';
        const priority = /empresa inteira|toda a equipe|todos parados|crítico/.test(s) ? 'CRITICAL' : /não consigo trabalhar|urgente|hoje/.test(s) ? 'HIGH' : /pedido|solicito|gostaria/.test(s) ? 'LOW' : 'MEDIUM';
        const intent = /analista|atendente|humano|transferir/.test(s) ? 'TRANSFER' : /status|acompanhar|meus chamados|consultar/.test(s) ? 'STATUS' : /como|ajuda|tutorial|orientação|horário/.test(s) ? 'HELP' : /rh|salário|financeiro|férias/.test(s) ? 'OTHER' : 'CREATE';
        return { intent, category, priority, type: /pedido|solicito|preciso de acesso|novo monitor/.test(s) ? 'REQ' : 'INC', confidence: 0.72, reason: 'Classificação determinística por palavras-chave; revise o rascunho antes de confirmar.' };
    }
    private async decide(text: string): Promise<Decision> {
        const mastraDecision = await this.mastra.classify(text);
        if (mastraDecision) return mastraDecision;
        if (!process.env.OPENAI_API_KEY || process.env.AGENT_PROVIDER === 'mastra')
            return this.heuristic(text);
        try {
            const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 7000, maxRetries: 0 });
            const result = await client.chat.completions.create({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', response_format: { type: 'json_object' }, temperature: 0, messages: [{ role: 'system', content: 'Classifique solicitações de TI. Responda JSON com intent (TRANSFER,STATUS,HELP,CREATE,OTHER), confidence 0..1, reason, category (Acesso,Rede e VPN,Hardware,Software,E-mail,Outros), priority (CRITICAL,HIGH,MEDIUM,LOW), type (INC,REQ). Nunca execute ações.' }, { role: 'user', content: text.slice(0, 1500) }] });
            const d = JSON.parse(result.choices[0].message.content || '{}') as Partial<Decision>;
            const h = this.heuristic(text);
            return { intent: ['TRANSFER', 'STATUS', 'HELP', 'CREATE', 'OTHER'].includes(d.intent || '') ? d.intent! : h.intent, confidence: typeof d.confidence === 'number' ? Math.max(0, Math.min(1, d.confidence)) : h.confidence, reason: String(d.reason || h.reason), category: ['Acesso', 'Rede e VPN', 'Hardware', 'Software', 'E-mail', 'Outros'].includes(d.category || '') ? d.category! : h.category, priority: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(d.priority || '') ? d.priority! : h.priority, type: ['INC', 'REQ'].includes(d.type || '') ? d.type! : h.type };
        }
        catch {
            return { ...this.heuristic(text), reason: 'Modelo indisponível; classificação local aplicada.' };
        }
    }
    async respond(conversationId: string, text: string, user: Principal) {
        const decision = await this.decide(text);
        const actions: string[] = [`Intenção: ${decision.intent}`, `Confiança: ${decision.confidence}`, `Motivo: ${decision.reason}`];
        let reply = '';
        let draft: TicketDto | null = null;
        let transfer = false;
        if (decision.intent === 'TRANSFER' || decision.priority === 'CRITICAL' || decision.confidence < 0.55) {
            transfer = true;
            reply = 'Vou encaminhar esta conversa a um analista com o contexto do atendimento.';
            actions.push('Transferência solicitada; agente pausado');
        }
        else if (decision.intent === 'STATUS') {
            const tickets = await this.tickets.list(user);
            reply = tickets.length ? `Seus chamados: ${tickets.map(t => `${t.number} (${t.status}${isOverdue(t) ? ', vencido' : ''})`).join('; ')}.` : 'Você ainda não possui chamados.';
            actions.push('Consultou apenas os chamados do usuário autenticado');
            if (tickets.some(t => isOverdue(t) && t.status !== 'RESOLVED')) {
                transfer = true;
                reply += ' Há chamado vencido; transferindo para analista.';
            }
        }
        else if (decision.intent === 'HELP') {
            const articles = await this.db.article.findMany();
            const terms = text.toLowerCase().split(/\W+/).filter(t => t.length > 3);
            const matches = articles.map(a => ({ article: a, score: terms.filter(t => `${a.title} ${a.keywords}`.toLowerCase().includes(t)).length })).sort((a, b) => b.score - a.score);
            if (matches[0]?.score) {
                reply = `${matches[0].article.title}: ${matches[0].article.body}`;
                actions.push(`Consultou artigo ${matches[0].article.id}`);
            }
            else {
                reply = 'Não encontrei um artigo confiável. Descreva o problema para abrir um chamado ou solicite um analista.';
                actions.push('Nenhum artigo com correspondência suficiente');
            }
        }
        else if (decision.intent === 'OTHER') {
            reply = 'Este canal atende apenas assuntos de TI. Procure o setor responsável para essa solicitação.';
            actions.push('Assunto fora do escopo');
        }
        else {
            draft = { title: text.slice(0, 75), description: text, type: decision.type, category: decision.category, priority: decision.priority, affected: 'A confirmar' };
            reply = `Preparei um rascunho de ${draft.type} (${draft.category}, prioridade ${draft.priority}). Informe quem é afetado e confirme antes da criação.`;
            actions.push('Rascunho preparado; nenhuma alteração persistida em chamados');
        }
        await this.db.audit.create({ data: { actorId: user.sub, action: 'AGENT_DECISION', entityId: conversationId, metadata: JSON.stringify({ decision, actions, timestamp: new Date().toISOString(), rule: transfer ? 'ESCALATE' : decision.intent, ticketMutation: false }) } });
        return { reply, actions: { intent: decision.intent, confidence: decision.confidence, reason: decision.reason, classification: { type: decision.type, category: decision.category, priority: decision.priority }, steps: actions, transfer, ticketMutation: false }, draft, transfer };
    }
}
