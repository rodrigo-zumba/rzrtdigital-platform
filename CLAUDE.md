# CLAUDE.md — RZRT Digital Platform

Este arquivo é lido em toda sessão. Contém **decisões fechadas**, não sugestões.
Especificação completa: `docs/ESPECIFICACAO.md`. Prompts por fase: `docs/PROMPTS.md`.

---

## 1. Regras de comportamento

1. **Não redecidir arquitetura.** As decisões da seção 2 estão fechadas. Se você acha que alguma está errada, **pare e pergunte** — não implemente uma alternativa.
2. **Não criar tela sem backend.** Nenhuma página com dado hardcoded, `mockData` inline ou número fixo em componente. Se o backend não existe, a rota não existe.
3. **Escopo fechado por fase.** Implemente apenas a fase pedida. Não "adiante" módulos de fases futuras.
4. **Uma feature = um commit atômico** com mensagem convencional (`feat:`, `fix:`, `chore:`).
5. Ao terminar, rode a **Definition of Done** (seção 7) e cole a saída real dos comandos. Não afirme que passou sem executar.
6. **Não invente API.** Se não tem certeza da assinatura de uma lib (Auth.js v5, Prisma extensions, SDK do storage), consulte a documentação antes de escrever.

## 2. Stack — decisões fechadas

| Camada | Escolha | Não usar |
|---|---|---|
| Framework | Next.js App Router + TypeScript `strict` | Pages Router |
| Auth | **Auth.js v5 (NextAuth)** — Credentials provider | Supabase Auth, Clerk, auth caseira |
| DB | PostgreSQL 16 (Neon ou Supabase **apenas como Postgres**) | MySQL, Mongo |
| ORM | Prisma | Drizzle, SQL cru fora de migrations |
| Storage | S3-compatível (Cloudflare R2) via presigned URL | upload passando pelo route handler |
| E-mail | Resend | SMTP manual, nodemailer |
| Rate limit | Upstash Redis (`@upstash/ratelimit`) | contador em memória |
| Validação | Zod (schema é a fonte da verdade) | validação só no client |
| Forms | React Hook Form + `zodResolver` | estado manual |
| Charts | Recharts | Chart.js |
| Tabelas | TanStack Table | tabela manual com paginação client-side |
| Estilo | Tailwind CSS | CSS-in-JS |
| Testes | Vitest + `@testing-library/react` + Playwright (E2E, fase 2+) | Jest |

**RLS não é usada.** O isolamento é garantido pela camada de dados (seção 4). Se algum dia migrar para RLS, é decisão nova e documentada.

### Topologia — fechada

Repositório **separado** do site institucional. Duas aplicações independentes, dois deploys.

| Ambiente | Domínio | Branch | Banco | Bucket | Seed |
|---|---|---|---|---|---|
| Produção | `app.rzrtdigital.com` | `main` | `rzrt_prod` | `rzrt-files-prod` | **nunca** |
| Desenvolvimento | `dev.rzrtdigital.com` | `develop` | `rzrt_dev` | `rzrt-files-dev` | sim |

- O site institucional (`rzrtdigital.com`) **não é alterado** por este projeto, exceto um link "Área do cliente" apontando para `app.rzrtdigital.com`.
- **Nunca** `dev.app.rzrtdigital.com` — certificado wildcard `*.rzrtdigital.com` cobre só um nível. Use `dev.` na raiz.
- Bancos, buckets, Redis, `AUTH_SECRET` e chaves de e-mail são **separados por ambiente**. Nada compartilhado.
- Detalhes em `docs/AMBIENTES.md`.

## 3. Convenções

- **Código, tabelas, colunas, enums: inglês.** **Rotas, labels, e-mails, mensagens de erro ao usuário: português.**
- Chave de tenant: **`organizationId`**. Nunca `tenantId`, `companyId`, `clientId`.
- Dinheiro: `Decimal @db.Decimal(14,2)`. **Nunca `Float`.**
- Datas: `DateTime` em UTC no banco; exibição em `America/Sao_Paulo`. Datas de métrica são `@db.Date` (sem hora).
- IDs: `cuid2` (`@default(cuid())` até migrar) — não sequencial, não exposto em ordem.
- Soft delete: `deletedAt DateTime?` nos modelos da seção 5 do spec. Delete físico só via script administrativo.
- Um arquivo = uma responsabilidade. Route handler não contém regra de negócio.

## 4. Invariantes de segurança (não negociáveis)

1. **Nenhum `prisma.*` fora de `src/modules/*/repositories/`.** Há regra de ESLint (`no-restricted-imports`) bloqueando `@/lib/db` em outros diretórios. Não desabilite a regra.
2. Todo repository de modelo com tenant recebe `ctx: RequestContext` e **filtra por `organizationId` derivado do `ctx`**, nunca por id vindo do request sem validação.
3. **Autorização = servidor.** Esconder botão no front não é proteção. Toda Server Action e Route Handler começa com `requirePermission(...)`.
4. O JWT carrega **apenas `userId`**. Status, roles, memberships e assignments são resolvidos do banco a cada request (`getRequestContext()`, memoizado com `cache()` por request). Isso garante que suspender um usuário derruba o acesso na hora.
5. Nunca retornar ao client: `passwordHash`, `tokenHash`, qualquer token, dados de outra organização, ou campos internos não solicitados. Use DTOs explícitos (`toPublicUser()`), não `select: *`.
6. Tokens de convite e de reset: gerar aleatório de 32 bytes, **armazenar só o hash SHA-256**, uso único, expiração (convite 7d, reset 1h).
7. Mensagens de erro de auth são genéricas ("Credenciais inválidas", "Se o e-mail existir, enviaremos as instruções") — sem enumeração de usuário.
8. Toda operação de escrita relevante grava `AuditLog`. Metadados **nunca** contêm senha, token ou segredo.
9. Segredos só em env var. `.env*` no `.gitignore` (exceto `.env.example`).
10. **Cookie de sessão é host-only.** Não defina `cookies.sessionToken.options.domain` no Auth.js. Definir `.rzrtdigital.com` vazaria a sessão para o site institucional e para qualquer outro subdomínio, incluindo o de dev.
11. **Em produção só `prisma migrate deploy`.** `migrate dev` e `migrate reset` têm guard que aborta se `NODE_ENV=production`. O seed também.
12. **Fora de produção, e-mail nunca sai para endereço real.** Allowlist de domínios (`@rzrtdigital.com`, `@demo.rzrtdigital.com`); qualquer outro destinatário é logado, não enviado.
13. `dev.rzrtdigital.com` tem `noindex` + proteção de acesso. Painel de cliente não é indexável nem em produção.

## 5. Fluxo obrigatório de toda mutação

```
Zod parse → getRequestContext() → requirePermission(action) →
assertOrganizationAccess(organizationId) → service (regra de negócio) →
repository (transação) → auditLog → DTO de resposta
```

Se um passo não se aplica, deixe um comentário dizendo por quê.

## 6. Estrutura de pastas

Ver `docs/ESPECIFICACAO.md` §9. Não crie pasta nova sem necessidade real; não crie `services/` vazio para módulo que ainda não existe.

## 7. Definition of Done (rodar e colar a saída)

```bash
pnpm prisma migrate reset --force   # migrations + seed limpos
pnpm typecheck                      # tsc --noEmit, zero erro
pnpm lint                           # zero erro
pnpm test                           # todos verdes, incluindo tenant-isolation
pnpm build                          # build de produção sem warning de tipo
```

Além disso, para cada entrega, reporte:
- rotas criadas e quem acessa cada uma;
- permissões novas adicionadas à matriz;
- variáveis de ambiente novas (adicionadas ao `.env.example`);
- o que **não** foi feito e por quê.
