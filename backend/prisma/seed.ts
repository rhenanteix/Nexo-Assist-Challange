import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const people = [ ['ana@nexo.com.br','Ana Souza','EMPLOYEE'], ['bruno@nexo.com.br','Bruno Lima','EMPLOYEE'], ['analista@nexo.com.br','Marina Costa','ANALYST'] ];
  for (const [email,name,role] of people) await db.user.upsert({ where: { email }, update: {}, create: { email,name,role } });
  const ana = await db.user.findUniqueOrThrow({ where: { email: 'ana@nexo.com.br' } });
  const samples = [ ['INC-20311','Notebook lento após atualização do Windows','Hardware','MEDIUM','PENDING',-6], ['REQ-10442','Segundo monitor para home office','Hardware','LOW','APPROVED',-7], ['INC-20150','Senha do SAP bloqueada','Acesso','MEDIUM','RESOLVED',-4] ] as const;
  for (const [number,title,category,priority,status,days] of samples) await db.ticket.upsert({ where: { number }, update: {}, create: { number,title,description:title,type:number.slice(0,3),category,priority,status,affected:'Só eu',ownerId:ana.id,dueAt:new Date(Date.now() + days*86400000),resolvedAt:status==='RESOLVED'?new Date(Date.now()-4*86400000):null } });
  const articles = [ ['VPN erro 809','No Windows 10, reinstale o cliente VPN pelo portal de softwares e reinicie. No Windows 11, abra um chamado.','vpn 809 windows'], ['Horário de atendimento','Segunda a sexta das 8h às 18h; incidentes críticos têm plantão 24 horas.','horário atendimento plantão'], ['Redefinir senha','Use o portal de identidade corporativa para redefinir a senha.','senha login acesso'], ['Outlook não sincroniza','Verifique a conexão, reinicie o Outlook e teste o webmail.','outlook email sincroniza'], ['Notebook lento','Reinicie o equipamento e confira atualizações pendentes.','notebook lento computador'], ['Wi-Fi corporativo','Conecte-se à rede corporativa com seu usuário de domínio.','wifi rede internet'], ['Solicitação de software','Informe nome do software, justificativa e gestor responsável.','software instalar programa'] ];
  for (const [title,body,keywords] of articles) { if (!(await db.article.findFirst({ where: { title } }))) await db.article.create({ data: { title,body,keywords } }); }
  console.log('Seed concluído. Login: ana@nexo.com.br ou analista@nexo.com.br; qualquer senha não vazia.');
}
main().finally(() => db.$disconnect());
