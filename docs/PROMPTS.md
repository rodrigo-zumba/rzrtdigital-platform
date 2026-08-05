# Prompts por etapa

Como usar: crie o repositório novo, coloque `CLAUDE.md` na raiz e `docs/ESPECIFICACAO.md` + `docs/AMBIENTES.md` em `docs/`. Rode em **Claude Code**, com acesso ao repositório — não em chat colando arquivos. Uma etapa por sessão, uma branch por etapa.

Para a etapa 0, dê ao Claude Code acesso **aos dois repositórios** (o do site institucional em modo leitura e o novo), ou copie o `tailwind.config` e o CSS global do institucional para dentro do repo novo antes de começar.

Sonnet dá conta das etapas 0, 2, 3 e 4. Use Opus/Fable nas etapas 1 (plano) e 5 (revisão de segurança), onde errar é caro.

---

## Etapa 0 — Bootstrap e identidade visual

```
Leia CLAUDE.md, docs/ESPECIFICACAO.md e docs/AMBIENTES.md.

Este é um repositório NOVO. A plataforma vive em app.rzrtdigital.com, separada
do site institucional. Execute a seção 0 do spec.

1. Inicialize o projeto: Next.js App Router + TypeScript strict + Tailwind +
   ESLint + Prettier + Vitest. Alinhe as versões de Next/React/Tailwind com as do
   site institucional.
2. Extraia a identidade visual do site institucional (leitura apenas, não altere
   aquele repo) e materialize em src/styles/tokens.css + tailwind-preset.ts, com
   o comentário de fonte-da-verdade descrito no spec.
3. Crie .env.example com TODAS as variáveis da seção 15.5, e src/lib/env.ts
   validando com Zod e falhando no boot.
4. docker-compose.yml com Postgres para desenvolvimento local.
5. Configure a regra de ESLint no-restricted-imports bloqueando @/lib/db fora de
   src/modules/*/repositories/.
6. Scripts no package.json: dev, build, typecheck, lint, test, prisma:*,
   create-superadmin, e o guard-production descrito em docs/AMBIENTES.md.
7. Headers de segurança e noindex no next.config.

NÃO crie schema de banco, nem auth, nem página nenhuma além do layout raiz.
Isso é só o esqueleto.

Ao terminar, cole a saída de `pnpm typecheck`, `pnpm lint` e `pnpm build`, e
liste os tokens de design que extraiu (cores com hex, fontes, escala).
```

---

## Etapa 1 — Plano (não escrever código)

```
Com base na auditoria anterior, produza o plano de implementação da Fase 1 em
docs/PLANO-FASE-1.md.

Formato: lista ordenada de passos. Cada passo com:
- objetivo em uma linha;
- arquivos que serão criados ou alterados (caminhos exatos);
- como eu verifico que funcionou (comando ou clique concreto);
- risco principal.

Regras:
- máximo 15 passos, agrupados em commits;
- cada passo tem que caber em um commit revisável;
- ordem obrigatória: banco → auth → contexto de request → permissões →
  organizações/usuários → convites+e-mail → middleware/layouts → dashboards → testes;
- não inclua nada das fases 2 a 5;
- ao final, liste as migrations previstas e as env vars novas.

Não implemente ainda. Só o plano. Vou aprovar antes.
```

---

## Etapa 2 — Fundação de dados

```
Implemente os passos 1 a N do docs/PLANO-FASE-1.md (banco e modelo de dados).

Escopo:
- prisma/schema.prisma completo conforme seção 5 do spec, com todos os índices,
  @@unique e enums;
- src/lib/env.ts com validação Zod das env vars;
- src/lib/db/ com cliente Prisma + extensão de tenant guard (seção 2 do spec):
  para modelos tenant-scoped, lança erro se a query não tiver organizationId no where;
- soft delete via deletedAt filtrado por padrão na extensão;
- migration inicial;
- prisma/seed.ts conforme seção 15.6 (domínio @demo.rzrtdigital.com, senha
  aleatória impressa, recusa rodar em produção);
- script create-superadmin com prompt interativo.

Ao terminar: rode `pnpm prisma migrate reset --force` e `pnpm typecheck` e cole a
saída real. Depois me mostre o schema final e explique cada @@unique que criou.
```

---

## Etapa 3 — Auth e autorização

```
Implemente autenticação e autorização (seções 3, 4 e 6 do spec).

Ordem:
1. src/lib/auth/ — config Auth.js v5, Credentials provider, hash Argon2id.
   O JWT carrega SOMENTE userId.
2. getRequestContext() — resolve do banco: user, status, internalRole ou
   memberships, assignments. Memoizado com cache() por request. Invalida se
   status !== ACTIVE.
3. src/lib/permissions/matrix.ts — matriz completa role × permission.
4. Helpers: hasPermission, requirePermission, canAccessOrganization,
   assertOrganizationAccess, canAccessProject, canManageUser.
5. src/lib/errors/ — AppError, ForbiddenError, NotFoundError + mapeamento HTTP.
6. Rate limit (Upstash) em login, esqueci-senha e convite.
7. src/lib/email/ — Resend + templates de convite, reset e verificação.
   Com EMAIL_TRANSPORT=console, loga o link em dev.
8. Fluxos: login, logout, esqueci-minha-senha, redefinir-senha,
   verificação de e-mail, convite (token hasheado, uso único, expiração).
9. Bloqueio por tentativas (failedLoginAttempts + lockedUntil).

Restrições:
- can() e scope() são conceitos separados, não misture;
- mensagens de erro genéricas, sem enumeração de usuário;
- nada de role dentro do token.

Ao terminar, escreva os testes das seções 13.2 a 13.5 e 13.8 e cole a saída do
`pnpm test`.
```

---

## Etapa 4 — Rotas, layouts e dashboards

```
Implemente as rotas protegidas e os dashboards iniciais (seções 8 e 12 do spec).

- middleware.ts fechado por padrão: intercepta tudo exceto (auth), _next e
  assets. Middleware só checa presença de sessão e redireciona. Autorização real
  fica nos layouts server-side.
- Layouts separados: (auth), admin, portal. NÃO existe route group público —
  as páginas de marketing ficam no site institucional.
- Rota / redireciona por perfil conforme a seção 8 do spec.
- Shell dos painéis: sidebar recolhível, header, seletor de organização,
  notificações, menu do usuário, breadcrumbs. Tema escuro usando os tokens de
  src/styles/tokens.css extraídos na etapa 0 — não invente paleta nova.
- Dashboard admin e dashboard do cliente, alimentados por queries agregadas
  reais sobre os dados do seed.
- Estados: loading, empty, error, forbidden, partial. Todos implementados, não
  só o caminho felizes.

Proibido:
- número hardcoded em componente;
- criar página de módulo da Fase 4 (projetos, campanhas, relatórios, arquivos,
  chamados) — nem placeholder, nem "em breve" com layout completo;
- findMany + reduce no Node para agregação; use query agregada.

Mobile e acessibilidade nesta etapa, não depois: teclado, foco visível,
contraste AA, toque ≥44px, zero scroll horizontal.

Ao terminar, cole a saída de `pnpm build` e liste cada rota criada com quem
acessa.
```

---

## Etapa 5 — Revisão de segurança (usar o modelo mais forte)

```
Você é um revisor de segurança independente. Não escreveu esse código. Seja cético.

Contexto: CLAUDE.md e docs/ESPECIFICACAO.md.

1. Escreva tests/integration/tenant-isolation.spec.ts conforme a seção 13.1:
   fábrica com Org A e Org B, e iteração automática sobre TODAS as rotas e server
   actions tentando acessar recursos de B com sessão de A — trocando o id na URL,
   no body e no query string. Esperado 403/404 em 100% dos casos.
   Rode. Se algum caso passar indevidamente, é bug: reporte antes de corrigir.

2. Audite e reporte, com arquivo e linha:
   - qualquer chamada a prisma fora de repositories;
   - qualquer query de modelo tenant-scoped sem filtro de organizationId;
   - qualquer autorização que dependa só do front-end;
   - qualquer retorno de passwordHash, token ou campo de outra organização;
   - IDOR: id do request usado como filtro sem validação de escopo;
   - escalada de privilégio na criação/edição de usuário e convite;
   - relatório DRAFT ou TicketMessage.isInternal visível ao cliente;
   - token de convite ou reset armazenado em texto puro;
   - segredo commitado ou env var com default perigoso;
   - endpoint de auth sem rate limit;
   - usuário suspenso mantendo acesso;
   - convite expirado sendo aceito.

3. Rode a Definition of Done do CLAUDE.md e cole a saída.

4. Entregue docs/ARQUITETURA.md conforme seção 16 do spec.

Formato do relatório: tabela com severidade (crítico/alto/médio/baixo),
arquivo:linha, descrição, correção proposta. Não corrija nada antes de eu
aprovar a lista.
```

---

## Regras para toda sessão

Cole no fim de qualquer prompt quando o modelo começar a se soltar:

```
Lembretes:
- se não tem certeza de uma assinatura de API, consulte a doc antes de escrever;
- se o spec e o código existente conflitam, pare e pergunte;
- não afirme que testou sem colar a saída do comando;
- ao final, liste o que NÃO foi feito e por quê.
```
