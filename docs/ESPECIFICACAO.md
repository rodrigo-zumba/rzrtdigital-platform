# RZRT Digital — Plataforma de Gestão da Agência

Especificação técnica. Documento único de verdade. Alterações aqui são decisões, não sugestões.

---

## 0. Passo zero: extrair a identidade visual, não auditar o site

A plataforma é um **projeto novo, repositório separado**, servido em `app.rzrtdigital.com`. O site institucional (`rzrtdigital.com`) fica intacto.

Consequências:

- Sem route group `(public)` no app. A única área não autenticada é a de auth.
- Sem risco de quebrar o site que já está no ar, e sem middleware pesando nas páginas públicas.
- O `output: 'export'` do institucional deixa de ser problema — ele continua estático se for o caso.
- Único toque no institucional: um link "Área do cliente" → `https://app.rzrtdigital.com`.

**Antes de codar, extrair do repositório do site institucional** (leitura, não alteração):

1. Tokens de design: paleta, escala de cinzas do tema escuro, fontes e pesos, raio de borda, escala de espaçamento, sombras.
2. `tailwind.config` — cores customizadas, plugins, fontes.
3. Componentes de UI reutilizáveis que valem replicar (botão, input, card, badge).
4. Versões de Next, React, TypeScript e Tailwind, para o app nascer alinhado.

Materialize isso em `src/styles/tokens.css` + `tailwind-preset.ts` **dentro do novo repo**, com um comentário no topo: *fonte da verdade é o repo do site institucional; sincronizar manualmente quando a marca mudar*.

> Duplicação consciente é melhor que monorepo aqui. Turborepo para duas apps e um dev só é overhead que você paga toda semana para resolver um problema que aparece uma vez por ano. Se a marca mudar, são cinco minutos de copiar e colar.

O que a plataforma **não** herda: `src/data/metrics.ts` e qualquer placeholder do institucional. Nenhum número de demonstração atravessa para cá.

---

## 1. Produto

Duas áreas sobre a mesma base:

- **Painel administrativo** (equipe RZRT): clientes, usuários, convites, projetos, campanhas, métricas, relatórios, arquivos, chamados, logs, configurações.
- **Portal do cliente**: dashboard da própria organização, projetos, campanhas, relatórios publicados, arquivos liberados, chamados, equipe.

## 2. Multi-tenant

Cada empresa cliente é uma `Organization`. Chave: **`organizationId`**.

Isolamento em três camadas:

1. **Camada de dados** — nenhum acesso a Prisma fora dos repositories; todo repository de modelo com tenant exige `organizationId` derivado do contexto autenticado.
2. **Guard de aplicação** — `assertOrganizationAccess(ctx, organizationId)` em toda operação, antes da regra de negócio.
3. **Prisma Client Extension** — extensão de query que, para os modelos marcados como tenant-scoped, lança erro em runtime se a query não contiver `organizationId` no `where`. É a rede de segurança contra `where` esquecido.

> Rede de segurança é obrigatória. É o único mecanismo que protege quando alguém (humano ou modelo) esquece um filtro.

Regra prática: **um `organizationId` que chega do request nunca é usado como filtro; ele é usado como *valor a validar* contra o escopo do usuário.**

## 3. Identidade: dois eixos, não uma escada

O erro comum é misturar cargo interno com papel no cliente em um único enum. Aqui são eixos separados.

### Eixo 1 — `User.type`

| Valor | Significado |
|---|---|
| `INTERNAL` | Equipe RZRT Digital |
| `CLIENT` | Pessoa de uma empresa cliente |

### Eixo 2a — `InternalUserProfile.internalRole` (só para `INTERNAL`)

| Role | Escopo de organizações | Poderes |
|---|---|---|
| `SUPER_ADMIN` | todas | tudo, incluindo configurações globais, gestão de admins, exclusão de organização, leitura de audit log |
| `ADMIN` | todas | operação completa (CRUD de clientes, projetos, campanhas, relatórios, arquivos, chamados, convites). Não altera config global nem gerencia admins |
| `MANAGER` | **apenas atribuídas** | gerencia o que é da carteira dele; publica relatório; responde chamado |
| `ANALYST` | **apenas atribuídas** | atualiza métricas, cria relatório em rascunho (não publica), sobe arquivo, atualiza tarefa |

Acesso de interno a uma organização vem de `OrganizationAssignment` — **nunca** de `OrganizationMember`.

### Eixo 2b — `OrganizationMember.role` (só para `CLIENT`)

| Role | Poderes |
|---|---|
| `CLIENT_ADMIN` | tudo da própria org + convidar/remover membros |
| `CLIENT_MEMBER` | ver dashboards/projetos/campanhas permitidos, baixar arquivos, abrir e responder chamados |
| `CLIENT_VIEWER` | somente leitura + download do que foi liberado |

**v1 expõe na UI:** `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `CLIENT_ADMIN`, `CLIENT_MEMBER`.
`ANALYST` e `CLIENT_VIEWER` existem no enum e na matriz de permissões, mas ficam fora dos seletores até haver demanda. Reduz superfície sem custo de migração depois.

Um `CLIENT` pode ter membership em mais de uma organização (agências, holdings). Se tiver >1 ativa, mostra seletor de workspace no login.

## 4. Permissões

Matriz estática, tipada, em `src/lib/permissions/matrix.ts`. **Não** é configurável em banco no v1 (permissão dinâmica é uma feature inteira, não um detalhe).

```ts
export const PERMISSIONS = [
  'organizations.create','organizations.read','organizations.update','organizations.archive','organizations.delete',
  'users.invite','users.read','users.update','users.suspend','users.remove',
  'assignments.manage',
  'projects.create','projects.read','projects.update','projects.archive',
  'tasks.manage',
  'campaigns.create','campaigns.read','campaigns.update','campaigns.archive',
  'metrics.write','metrics.read',
  'reports.create','reports.read','reports.publish','reports.archive',
  'files.upload','files.download','files.delete',
  'tickets.create','tickets.read','tickets.respond','tickets.manage','tickets.internalNotes',
  'notifications.read',
  'settings.manage','settings.global.manage',
  'auditLogs.read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];
```

Separe claramente os dois conceitos:

- **`can(ctx, permission)`** — *o que* esse usuário pode fazer (vem da matriz de role).
- **`scope(ctx)`** — *sobre quais organizações* (todas, ou o conjunto de `OrganizationAssignment` / `OrganizationMember`).

Autorização = `can()` **E** `scope()`. Confundir os dois é a causa raiz de vazamento entre tenants.

Helpers obrigatórios em `src/lib/permissions/`:

```ts
hasPermission(ctx, permission): boolean
requirePermission(ctx, permission): void            // lança ForbiddenError
canAccessOrganization(ctx, organizationId): boolean
assertOrganizationAccess(ctx, organizationId): void
canAccessProject(ctx, projectId): Promise<boolean>
canManageUser(ctx, targetUserId): Promise<boolean>  // ninguém escala privilégio acima do próprio
```

Regra extra: **ninguém concede um papel superior ao seu, nem edita/suspende usuário de nível igual ou superior.** `SUPER_ADMIN` não pode se auto-remover se for o último ativo.

## 5. Modelo de dados

Base a partir do que você já escreveu, com as correções marcadas com ⚠.

### User
`id, name, email @unique, passwordHash?, avatarUrl?, type (INTERNAL|CLIENT), status, emailVerifiedAt?, lastLoginAt?, failedLoginAttempts, lockedUntil?, createdAt, updatedAt`
⚠ `failedLoginAttempts` + `lockedUntil` são necessários para o bloqueio por tentativa que você pediu.
⚠ E-mail normalizado em lowercase antes de gravar e antes de buscar.

### Organization
`id, name, slug @unique, legalName?, document?, logoUrl?, website?, phone?, segment?, status, onboardingCompletedAt?, createdAt, updatedAt, deletedAt?`
⚠ `slug` com lista de reservados (`admin`, `portal`, `api`, `login`, `convite`, ...).
⚠ `document` (CNPJ) validado e armazenado só com dígitos; aceitar o formato **alfanumérico** novo (CNPJs emitidos a partir de jul/2026).

### OrganizationMember
`id, userId, organizationId, role (CLIENT_*), status, invitedById?, joinedAt?, createdAt, updatedAt`
`@@unique([userId, organizationId])`

### InternalUserProfile
`id, userId @unique, internalRole, jobTitle?, createdAt, updatedAt`

### OrganizationAssignment
`id, organizationId, userId, assignmentType (ACCOUNT_MANAGER|ANALYST|SUPPORT), createdAt`
`@@unique([organizationId, userId, assignmentType])`

### Invitation
`id, email, organizationId?, targetType (INTERNAL|CLIENT), role, tokenHash @unique, invitedById, expiresAt, acceptedAt?, revokedAt?, status, createdAt`
⚠ `organizationId` nullable: convite de usuário interno não tem organização.
⚠ Só um convite `PENDING` por (email, organizationId) — revogar o anterior ao reenviar.

### Project
`id, organizationId, name, description?, type, status, priority, startDate?, dueDate?, progress (Int 0-100), ownerId?, createdById, createdAt, updatedAt, deletedAt?`

### ProjectMember
`id, projectId, userId, permissionLevel, createdAt` · `@@unique([projectId, userId])`

### Task
`id, projectId, title, description?, status, priority, assignedToId?, dueDate?, completedAt?, createdAt, updatedAt`
⚠ Sem `organizationId` próprio — deriva de `Project`. Mas o repository **sempre** faz join validando o tenant do projeto.

### Campaign
`id, organizationId, projectId?, name, platform, objective?, status, startDate?, endDate?, budget Decimal(14,2)?, currency (default 'BRL'), createdAt, updatedAt, deletedAt?`

### CampaignMetric
`id, campaignId, date @db.Date, impressions Int, reach Int?, clicks Int, leads Int, conversions Int, spend Decimal(14,2), revenue Decimal(14,2)?, source (MANUAL|META_ADS|GOOGLE_ADS|...), createdAt, updatedAt`
⚠ **`@@unique([campaignId, date, source])`** — indispensável para `upsert` idempotente quando as integrações entrarem. Sem isso, a primeira sincronização duplica tudo.
⚠ **Não armazenar** CTR, CPC, CPM, CPL, CPA, ROAS. São derivados; calcular em uma única função pura (`src/services/metrics/derive.ts`) usada por API e UI. Divisão por zero retorna `null`, não `0` nem `Infinity`.
⚠ Definir por escrito o que é `date`: **o dia no fuso da plataforma de origem**, para não desalinhar quando integrar Meta/Google.

### Report
`id, organizationId, projectId?, title, description?, periodStart, periodEnd, status (DRAFT|REVIEW|PUBLISHED|ARCHIVED), content Json, publishedAt?, createdById, createdAt, updatedAt, deletedAt?`
⚠ `content` como JSON estruturado versionado (`{ version: 1, blocks: [...] }`), não HTML solto. Se um dia aceitar HTML, sanitizar no servidor.
⚠ Cliente só vê `PUBLISHED`. Isso é filtro **no repository**, não na query da página.

### File
`id, organizationId, projectId?, name, originalName, storageKey @unique, mimeType, size Int, checksum?, visibility (INTERNAL|CLIENT|PROJECT_MEMBERS), status (PENDING|ACTIVE|QUARANTINED), uploadedById, createdAt, deletedAt?`
⚠ `status`: com upload direto ao storage, o arquivo entra `PENDING`, é validado, e só então vira `ACTIVE`. Só `ACTIVE` aparece nas listagens.

### Ticket
`id, organizationId, number Int, subject, description, category, priority, status, createdById, assignedToId?, createdAt, updatedAt, closedAt?, deletedAt?`
⚠ `number` sequencial **por organização** (`@@unique([organizationId, number])`) — cliente referencia "chamado #12", não um cuid.

### TicketMessage
`id, ticketId, authorId, message, isInternal Boolean @default(false), createdAt, updatedAt`
⚠ `isInternal` filtrado **no repository** por tipo de usuário. Nunca chega ao client e é filtrado no React.

### Notification
`id, userId, organizationId?, type, title, message, link?, readAt?, createdAt`

### AuditLog
`id, actorUserId?, organizationId?, action, entityType, entityId?, metadata Json?, ipAddress?, userAgent?, createdAt`
⚠ `actorUserId` nullable (ações de sistema) e **sem `onDelete: Cascade`** — log não desaparece quando o usuário é removido.
⚠ Append-only: sem update, sem delete pela aplicação.

### Activity
Feed legível por humano para a UI (diferente de `AuditLog`, que é forense).
`id, organizationId, userId?, type, description, entityType?, entityId?, createdAt`

### Setting
`id, organizationId?, key, value Json, createdAt, updatedAt` · `@@unique([organizationId, key])`

### Session / Account / VerificationToken
Modelos do adapter do Auth.js. Mais: `PasswordResetToken (id, userId, tokenHash @unique, expiresAt, usedAt?)`.

### Enums
Os que você definiu estão bons. Adicionar: `UserType`, `InternalRole`, `MemberRole`, `AssignmentType`, `InvitationStatus`, `ReportStatus`, `FileVisibility`, `FileStatus`, `MetricSource`, `ProjectPriority`, `TicketCategory`.

## 6. Autenticação — o ponto onde seu spec se contradizia

Você pediu, ao mesmo tempo: sessão via Credentials, e "usuário suspenso perde acesso". Com JWT longo isso não acontece — o token continua válido até expirar. E o Credentials provider do Auth.js **exige** estratégia JWT (não aceita database session).

Solução fechada:

> **O JWT carrega apenas `userId`.** Nenhuma role, nenhum `organizationId`, nenhuma permissão. A cada request, `getRequestContext()` lê do banco: usuário, status, `internalRole` ou memberships, assignments. Memoizado por request com `cache()` do React. Se `status !== ACTIVE`, a sessão é invalidada na hora.

Custo: uma query por request (indexada, ~1ms). Ganho: revogação imediata, roles sempre frescas, zero risco de token com permissão desatualizada. Vale.

Implementar na fase 1:
- Login e-mail + senha (Argon2id; bcrypt cost 12 se Argon não estiver disponível)
- Logout
- Esqueci a senha → e-mail → redefinir (token único, hash, 1h, uso único, invalida sessões)
- Verificação de e-mail
- Convite com token (hash, 7d, uso único)
- Bloqueio após N tentativas (`lockedUntil`, backoff)
- Rate limit por IP **e** por e-mail em `/login`, `/esqueci-minha-senha`, `/convite/[token]`
- Erros genéricos, sem enumeração
- Redirecionamento por perfil: `INTERNAL → /admin`; `CLIENT` com 1 org → `/portal`; com >1 → `/selecionar-workspace`
- Cookies `httpOnly`, `secure` em produção, `sameSite=lax`
- Headers de segurança (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`) no `next.config`
- Estrutura preparada para 2FA: tabela e coluna previstas, fluxo não implementado

⚠ **`AUTH_SECRET` gerado, nunca com valor default e nunca commitado.**

## 7. E-mail transacional — corrigido para a Fase 1

Você colocou "e-mails transacionais" na Fase 5, mas a Fase 1 tem convite e recuperação de senha. Sem envio, nada disso funciona. **Resend entra na Fase 1**, com:

- Templates: convite, redefinição de senha, verificação de e-mail, notificação de acesso concedido
- Em desenvolvimento sem `RESEND_API_KEY`: logar o link no console (`EMAIL_TRANSPORT=console`), nunca falhar silenciosamente
- Domínio remetente verificado (SPF/DKIM em `rzrtdigital.com`) — item de configuração externa

## 8. Rotas

Tudo abaixo vive em `app.rzrtdigital.com`. As rotas de marketing (`/servicos`, `/sobre`, `/projetos`, `/contato`) **ficam no site institucional** e não existem aqui.

Não autenticadas: `/login`, `/esqueci-minha-senha`, `/redefinir-senha`, `/convite/[token]`.
Autenticada sem organização definida: `/selecionar-workspace`.

`/` redireciona: sem sessão → `/login`; `INTERNAL` → `/admin`; `CLIENT` com 1 org → `/portal`; `CLIENT` com várias → `/selecionar-workspace`.

Admin (`/admin/...`): `clientes`, `clientes/[organizationId]`, `usuarios`, `projetos`, `projetos/[projectId]`, `campanhas`, `relatorios`, `arquivos`, `chamados`, `notificacoes`, `logs`, `configuracoes`.

Portal (`/portal/...`): `dashboard`, `projetos`, `projetos/[projectId]`, `campanhas`, `relatorios`, `arquivos`, `chamados`, `equipe`, `notificacoes`, `configuracoes`.

Layouts separados: `(auth)`, `admin`, `portal`.
⚠ `middleware.ts` só valida presença de sessão e redireciona. **Autorização real acontece no layout/server**, porque middleware roda no edge sem acesso confiável ao banco.
⚠ `matcher` cobre tudo menos `(auth)`, `_next` e assets. Como o domínio é dedicado, o padrão é "fechado" e a exceção é explícita — o inverso do que seria no repo compartilhado.

## 9. Estrutura de pastas

```
src/
  app/
    (auth)/              # login, senha, convite — única área não autenticada
    admin/
    portal/
    api/
  styles/tokens.css      # copiado do repo institucional
  components/{ui,layout,forms,charts,tables,admin,portal}/
  modules/
    auth/ organizations/ users/ invitations/ permissions/
    projects/ campaigns/ metrics/ reports/ files/ tickets/ notifications/ audit/
      # cada módulo: schemas/ services/ repositories/ actions/ types.ts
  lib/
    db/          # cliente Prisma + extensão de tenant guard
    auth/        # config Auth.js, getRequestContext, hash de senha
    permissions/ # matrix.ts, helpers
    security/    # rate limit, headers, tokens
    validation/  # zod compartilhado
    storage/     # presign, validação de arquivo
    email/       # cliente + templates
    errors/      # AppError, ForbiddenError, NotFoundError + mapeamento HTTP
  services/{integrations,metrics,notifications}/
  types/ hooks/
prisma/{schema.prisma,migrations/,seed.ts}
tests/{unit,integration,e2e}/
```

Módulos das fases 4-5 só ganham pasta quando forem implementados.

## 10. Server Actions vs Route Handlers

- **Server Actions**: formulários internos, mutações ligadas a uma página. Sempre com Zod + `requirePermission` na primeira linha.
- **Route Handlers**: webhooks, presign de upload, integrações externas, qualquer consumo por outro cliente.
- Erros padronizados: `AppError` → `{ ok: false, error: { code, message } }`. Nunca stack trace ao usuário; stack só no log/Sentry.

## 11. Arquivos

Upload **direto ao storage** com presigned URL — route handler serverless tem limite de body e você vai bater nele.

Fluxo: cliente pede presign (valida permissão, extensão, MIME declarado, tamanho máximo) → `File` criado como `PENDING` com `storageKey` aleatório (nunca o nome original) → cliente faz `PUT` → cliente confirma → servidor lê os primeiros bytes, confere **magic bytes** contra o MIME declarado e o tamanho real → `ACTIVE` ou `QUARANTINED`.

Download sempre por URL assinada de curta duração, emitida após checar `visibility` + tenant. Nunca URL pública.

Allowlist explícita de extensões. Limite por arquivo (ex.: 25 MB) e por organização.

## 12. Dashboards

Admin e cliente conforme seu spec — com estas regras:

- Zero número hardcoded em componente. Tudo vem de query agregada tipada.
- Estados obrigatórios em toda consulta: `loading`, `empty`, `error`, `forbidden`, `partial`.
- Métrica sem dado suficiente **não aparece** (ou aparece como "—"), não vira `0`.
- Comparação com período anterior calculada no servidor.
- Agregações pesadas: query SQL agregada, não `findMany` + `reduce` no Node.

## 13. Testes

Vitest. Prioridade absoluta:

1. **`tests/integration/tenant-isolation.spec.ts`** — o teste mais importante. Fábrica que cria Org A e Org B com dados, e itera **automaticamente sobre todas as rotas e actions** tentando acessar recursos de B com sessão de A. Esperado: 403/404 em 100%. Trocar id na URL, no body e no query string.
2. Matriz de permissões: teste tabelado role × permission comparado com a matriz.
3. Convite: aceite válido, expirado, já usado, revogado, e-mail divergente.
4. Reset de senha: token válido, expirado, reutilizado.
5. Usuário suspenso perde acesso no request seguinte.
6. `MANAGER`/`ANALYST` não veem organização não atribuída.
7. Cliente não vê relatório `DRAFT` nem `TicketMessage.isInternal`.
8. Escalada de privilégio: `CLIENT_ADMIN` não cria `SUPER_ADMIN`.
9. Métricas derivadas: divisão por zero.

## 14. Fases

**Fase 1 — Fundação** (é o que entra agora)
Postgres, Prisma, schema, migrations, seed, Auth.js, `getRequestContext`, organizações, usuários, memberships, assignments, roles, matriz de permissões, convites, e-mail transacional, rate limit, middleware, layouts admin e portal protegidos, dashboard inicial de cada lado com dados reais do seed, isolamento entre organizações, audit log das ações principais, suíte de testes de isolamento.

**Fase 2 — Administração**: CRUD completo de clientes, gestão de usuários, atribuições, tela de logs, notificações internas.
**Fase 3 — Portal**: perfil, organização, equipe, seletor de workspace, onboarding, notificações.
**Fase 4 — Operação**: projetos, tarefas, campanhas, métricas manuais, relatórios, arquivos, chamados.
**Fase 5 — Evolução**: integrações (Meta, Google Ads, GA4, TikTok, CRM, checkout), PDF, automações, webhooks, 2FA, cobrança.

Integrações: camada isolada em `services/integrations/` atrás de uma interface `MetricsProvider`. Componente nunca fala com API externa. O provider `MANUAL` é a implementação de referência.

## 15. Itens que faltavam no seu spec

1. **LGPD.** Você vai processar dados de campanha e contatos de clientes de terceiros. Precisa: base legal definida, política de retenção por entidade, fluxo de exclusão/portabilidade a pedido, registro de quem acessou o quê (o audit log resolve parte), e cláusula de tratamento de dados no contrato com cada cliente. Decidir agora onde ficam os dados (região do banco).
2. **Observabilidade.** Sentry (ou equivalente) para erro em produção. Sem isso você descobre bug pelo cliente reclamando.
3. **Backup.** Backup automático diário do Postgres + teste de restauração documentado. Não é opcional para dado de cliente.
4. **Primeiro superadmin.** Script `pnpm create-superadmin` que pede e-mail e senha por prompt — não seed com senha fixa, não usuário demo em produção.
5. **Env vars explícitas.** Validadas com Zod em `src/lib/env.ts`, falhando no boot se faltar alguma:
   `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TRANSPORT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, `APP_URL`, `SENTRY_DSN`.
6. **Seed identificável.** Tudo com domínio `@demo.rzrtdigital.com` e senha aleatória impressa no terminal. Seed recusa rodar se `NODE_ENV=production`.
7. **Acessibilidade e mobile** não são "revisão final": foco visível, navegação por teclado em modais/drawer, contraste AA no tema escuro, área de toque ≥44px, zero scroll horizontal. Verificar por página, não no fim.
8. **Definition of Done por fase** com saída de comando colada. Sem isso, "está funcional" é afirmação, não fato.

---

## 16. Documentação a entregar no fim da Fase 1

`docs/ARQUITETURA.md` com: decisão de stack e motivo, modelo de auth, modelo multi-tenant, roles, permissões, diagrama do banco, estrutura de pastas, env vars, como rodar migration e seed, como criar o primeiro superadmin, como cadastrar organização, como convidar cliente, como testar cada role, o que ficou pronto, o que ficou preparado, e o que depende de configuração externa (domínio de e-mail, bucket, Redis, Sentry).
