# Ambientes, domínios e deploy

## Topologia

```
rzrtdigital.com          → site institucional (repo existente, intocado)
app.rzrtdigital.com      → plataforma, PRODUÇÃO      (branch main)
dev.rzrtdigital.com      → plataforma, DESENVOLVIMENTO (branch develop)
```

**Nunca use `dev.app.rzrtdigital.com`.** Certificado wildcard `*.rzrtdigital.com` cobre apenas um nível de subdomínio; um terceiro nível exige certificado dedicado e vira dor de cabeça em renovação. Mantenha os dois ambientes na raiz.

Se a hospedagem for Vercel, os *preview deployments* por PR cobrem o papel de staging efêmero — mas o `dev.` fixo continua útil por ter banco com dados de demonstração estáveis para testar papéis.

## Matriz de recursos por ambiente

Nada é compartilhado. Compartilhar banco entre dev e prod é a forma mais rápida de apagar dado de cliente real.

| Recurso | Produção | Desenvolvimento |
|---|---|---|
| Banco | `rzrt_prod` | `rzrt_dev` (branch separada no Neon, se usar Neon) |
| `AUTH_SECRET` | próprio | próprio, diferente |
| Bucket S3/R2 | `rzrt-files-prod` | `rzrt-files-dev` |
| Upstash Redis | instância prod | instância dev |
| Resend | domínio verificado, envio real | `EMAIL_TRANSPORT=console` ou allowlist |
| Sentry | `environment=production` | `environment=development` |
| Seed | **bloqueado** | permitido |
| Indexação | `noindex` | `noindex` + proteção de acesso |

## Local

Terceiro ambiente: a máquina do dev.

- Postgres em Docker (`docker-compose.yml` no repo) ou uma branch do Neon.
- `EMAIL_TRANSPORT=console` — o link de convite e de reset sai no terminal.
- `.env.local` a partir do `.env.example`, nunca commitado.
- `pnpm prisma migrate reset --force` é seguro e esperado aqui.

## Fluxo de deploy

```
feature/* → PR → preview deploy → merge em develop → dev.rzrtdigital.com
develop → PR → merge em main → app.rzrtdigital.com
```

Pipeline obrigatório antes de qualquer merge:

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Em produção, o passo de release é `prisma migrate deploy` — nunca `migrate dev`, nunca `migrate reset`. Colocar um guard no `package.json`:

```json
"predeploy": "node scripts/guard-production.mjs"
```

que aborta se detectar `migrate reset` ou execução de seed com `NODE_ENV=production`.

## Migrations com dado real

Depois que houver cliente em produção, toda migration destrutiva (drop de coluna, mudança de tipo, `NOT NULL` em coluna existente) precisa ser feita em duas etapas:

1. Migration aditiva, deploy, backfill.
2. Migration destrutiva no release seguinte, depois de confirmar que nada mais lê a coluna antiga.

Isso não é rigor acadêmico: uma migration destrutiva em release único derruba o app durante o deploy.

## Proteção do ambiente de dev

`dev.rzrtdigital.com` expõe uma tela de login. Sem proteção, ele é indexado, aparece no Google e recebe tentativa de força bruta.

- `X-Robots-Tag: noindex, nofollow` em todas as respostas + `robots.txt` bloqueando tudo.
- Proteção de acesso na camada de hospedagem (Vercel Password Protection, Cloudflare Access, ou allowlist de IP).
- Rate limit ativo também em dev — é onde você descobre que ele está configurado errado.

Em produção, o painel também é `noindex`: `/admin` e `/portal` não têm nada a ganhar aparecendo em busca.

## Cookies e sessão

- Cookie de sessão **host-only**. Não definir `domain` no Auth.js. Com `Domain=.rzrtdigital.com`, o cookie de `app.` vazaria para o site institucional e para `dev.` — sessão de produção viajando para o ambiente de teste.
- `AUTH_URL` precisa bater exatamente com o domínio do ambiente. Errar aqui gera redirect quebrado no login e é o bug mais comum dessa montagem.
- Não há SSO entre o institucional e o app: o institucional não tem login, só um link.
- Como tudo é same-origin dentro do app, não é necessário configurar CORS. Se um dia o app precisar ser consumido pelo institucional via fetch, aí sim — e com allowlist explícita, nunca `*`.

## Primeiro deploy de produção — ordem

1. Provisionar banco, bucket, Redis.
2. Configurar env vars no host (todas as da seção 15.5 do spec).
3. `prisma migrate deploy`.
4. `pnpm create-superadmin` — e-mail e senha por prompt, senha forte, guardada em gerenciador.
5. Verificar domínio remetente no Resend (SPF + DKIM em `rzrtdigital.com`).
6. Confirmar backup automático diário ativo **e fazer uma restauração de teste**.
7. Login, criar a primeira organização, enviar o primeiro convite real para si mesmo e completar o fluxo ponta a ponta.
8. Só então convidar cliente.

## Configuração externa necessária (não dá para o agente fazer)

- DNS dos dois subdomínios.
- Verificação de domínio de e-mail (SPF/DKIM).
- Criação de bucket e chaves de acesso.
- Instâncias de Redis.
- Projeto no Sentry.
- Política de backup e teste de restauração.
- Proteção de acesso do `dev.`
