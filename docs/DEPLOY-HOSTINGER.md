# Deploy na VPS Hostinger

Complementa `docs/AMBIENTES.md` (que descreve a topologia assumindo Vercel).
A VPS já está montada e em produção — este documento só liga a automação em
cima do que já existe, não descreve um setup do zero.

## Estado atual da VPS (confirmado)

- Ubuntu 24.04 LTS, Node 22, pnpm, Nginx, PM2 (registrado como serviço
  systemd `pm2-deploy.service`, sobrevive a reboot).
- `/var/www/rzrt-prod` (branch `main`) e `/var/www/rzrt-dev` (branch
  `develop`), ambos clones deste repositório, dono `deploy`.
- PM2 com dois processos `online`: `rzrt-prod` e `rzrt-dev`.
- Nginx com sites habilitados para `app.rzrtdigital.com` e
  `dev.rzrtdigital.com`, cada um proxy para a porta local do processo
  correspondente.
- Rate limit já usando Upstash Redis real (não é mais o fallback fail-open
  que aparece em dev local).

O banco continua **fora** da VPS (Neon/Supabase, só Postgres — decisão
fechada no `CLAUDE.md` §2).

## O que falta: automatizar o que hoje é manual

Hoje, depois de um merge no GitHub, alguém entra por SSH e faz `git pull` +
`pnpm build` + restart no PM2 na mão. `scripts/deploy-remote.sh` (neste
repo) automatiza exatamente essa sequência, e
`.github/workflows/deploy.yml` dispara ele a cada push em `main`/`develop`
— mas só depois que a Definition of Done completa (typecheck, lint, test,
build) passar em CI.

### 1. Bootstrap único: colocar o script na VPS

Antes do primeiro deploy automático, o arquivo `scripts/deploy-remote.sh`
precisa existir nos dois diretórios (ele só chega lá depois de um `git
pull` — a automação não pode se auto-instalar na primeira vez):

```bash
cd /var/www/rzrt-prod && git pull origin main
cd /var/www/rzrt-dev  && git pull origin develop
```

Rode isso depois que este PR (que adiciona o script) for mergeado em
`main`/`develop`.

### 2. Secrets no GitHub (não aqui no chat)

Repositório → Settings → Secrets and variables → Actions → New repository
secret:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP ou hostname da VPS |
| `VPS_PORT` | porta do SSH |
| `VPS_USER` | `deploy` (o usuário já usado hoje para operar a VPS) |
| `VPS_SSH_KEY` | chave **privada** SSH; a pública correspondente precisa estar em `~/.ssh/authorized_keys` do usuário `deploy` na VPS — gere um par novo dedicado ao GitHub Actions, não reuse a chave pessoal de ninguém |

### 3. Confirmar que `deploy` reload sem sudo

O usuário `deploy` já opera os processos hoje na mão, então já deve
conseguir rodar `pm2 reload rzrt-prod` / `pm2 reload rzrt-dev` sem `sudo`
(o pm2 roda como esse mesmo usuário, via `pm2-deploy.service`). Vale só
confirmar isso com um teste manual antes de depender do CI:

```bash
# como o usuário deploy, na VPS:
pm2 reload rzrt-dev --update-env
```

Se pedir senha de sudo, o workflow vai falhar nesse passo — nesse caso avise
que precisamos ajustar a automação.

## Como funciona depois de configurado

Todo push em `main` ou `develop` roda a Definition of Done completa
(typecheck, lint, test com Postgres de serviço, build) e, só se tudo
passar, conecta via SSH e roda `scripts/deploy-remote.sh prod` ou
`scripts/deploy-remote.sh dev` — que faz `git reset --hard` para o commit
do push, `pnpm install`, `prisma migrate deploy` (nunca `migrate
dev`/`reset` — `docs/AMBIENTES.md`) e `pm2 reload` (zero-downtime).

Nenhum passo de deploy toca o banco fora de `migrate deploy`. Seed nunca
roda em nenhum dos dois ambientes da VPS.

## O que este documento não resolve

- Backup do Postgres (fora da VPS — configurar no provedor do banco).
- Rotação da chave SSH de deploy.
- Monitoramento (Sentry) e alerta de queda do processo PM2.
