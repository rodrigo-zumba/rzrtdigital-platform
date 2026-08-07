# Auditoria de segurança — Etapa 5

Revisão independente do código existente até a Fase 2 (CRUD de clientes) e
Etapa 4 (dashboards), conforme checklist de `docs/PROMPTS.md` Etapa 5.

## 1. Suíte de isolamento entre organizações

`tests/integration/tenant-isolation.spec.ts` — cobre `organizations.service`
(único módulo com CRUD completo até aqui): MANAGER/ANALYST fora da carteira,
CLIENT tentando tocar `organizations.*`, ADMIN sem `organizations.delete`,
organização soft-deleted, colisão de slug entre tenants. Todos os casos
esperam `ForbiddenError`/`NotFoundError` e nunca sucesso — 100% conforme.

**Ação para os próximos módulos**: à medida que Fase 2/3/4 ganham CRUD real
(usuários, projetos, campanhas, relatórios, arquivos, chamados), os casos
correspondentes devem ser adicionados a este mesmo arquivo — não criar um
arquivo novo por módulo.

## 2. Checklist item a item

| Item | Resultado |
|---|---|
| `prisma.*` fora de `repositories/` | Nenhuma ocorrência (`grep` confirma) |
| Query tenant-scoped sem `organizationId` no `where` | Bloqueado em runtime pelo tenant guard (`src/lib/db/tenant-guard.ts`), testado em `tests/unit/tenant-guard.spec.ts` |
| Autorização só no front | Toda action/service chama `requirePermission`/`assertOrganizationAccess` no servidor antes de qualquer leitura/escrita |
| Retorno de `passwordHash`/token/campo de outra org | `passwordHash` só aparece em `login.service.ts`, `password-reset.service.ts`, `invitation.service.ts` (uso interno, nunca no retorno ao client) e `request-context.repository.ts` usa `select` explícito sem esses campos |
| IDOR (id do request sem validar escopo) | `getOrganization`/`updateOrganization`/etc. chamam `assertOrganizationAccess` antes de qualquer leitura/escrita pelo id recebido |
| Escalada de privilégio em criação/edição de usuário e convite | Sem tela de gestão de usuário ainda (Fase 2) — revisar de novo quando essa tela existir |
| Relatório `DRAFT` / `TicketMessage.isInternal` visível ao cliente | Módulos ainda não implementados (Fase 4) — revisar quando existirem |
| Token de convite/reset em texto puro | `generateToken()` gera 32 bytes aleatórios, armazena só o hash SHA-256 (`hashToken`), nunca o token puro |
| Endpoint de auth sem rate limit | `login`, `esqueci-minha-senha` e `convite/[token]` usam `checkRateLimit` por IP e por e-mail/token (`src/lib/security/rate-limit.ts`) |
| Usuário suspenso mantendo acesso | `getRequestContext()` resolve status do banco a cada request (não do JWT) — suspender derruba acesso no request seguinte |
| Convite expirado sendo aceito | `invitation.service.ts` valida `expiresAt` antes de aceitar, coberto por teste em `auth-flows.spec.ts` |

## 3. Achado sem correção de código (infraestrutura, não código)

- Rate limit tem fail-open documentado (`checkRateLimit`): se o Upstash cair,
  a requisição passa em vez de bloquear. É uma escolha deliberada (rate
  limit como defesa em profundidade, não ponto único de falha) e já estava
  documentada no próprio código — mantida como está.
- Redis do Upstash compartilhado entre dev e produção (achado de infra, não
  de código — ver `docs/DEPLOY-HOSTINGER.md` e o levantamento de
  infraestrutura enviado em 07/08/2026).

## 4. Conclusão

Nenhum bug de segurança encontrado no código revisado. Os itens do checklist
relativos a módulos ainda não construídos (usuários, relatórios, tickets)
ficam marcados para nova revisão quando esses módulos forem implementados
nesta mesma sessão (Fases 2 e 4).
