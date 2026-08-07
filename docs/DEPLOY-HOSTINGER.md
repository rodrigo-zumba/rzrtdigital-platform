# Deploy na VPS Hostinger

Complementa `docs/AMBIENTES.md` (que descreve a topologia assumindo Vercel).
Esta VPS hospeda **os dois ambientes** (produção e desenvolvimento) como dois
processos Node.js independentes, atrás de um único Nginx.

```
app.rzrtdigital.com → Nginx → localhost:3001 → pm2 "rzrt-app-prod" (branch main)
dev.rzrtdigital.com  → Nginx → localhost:3002 → pm2 "rzrt-app-dev"  (branch develop)
```

O banco continua **fora** da VPS (Neon/Supabase, só Postgres — decisão fechada
no `CLAUDE.md` §2). Hospedar o banco na mesma VPS do app é o tipo de decisão
de arquitetura que exige parar e perguntar antes de implementar — não foi
essa a instrução aqui.

## Passo a passo (uma vez só, feito por você via SSH — o agente não tem acesso a este servidor)

### 1. Pacotes de sistema

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo npm install -g pm2
```

### 2. Diretórios e clone

```bash
sudo mkdir -p /var/www/rzrt-app-prod /var/www/rzrt-app-dev
sudo chown "$USER":"$USER" /var/www/rzrt-app-prod /var/www/rzrt-app-dev

git clone --branch main    git@github.com:rodrigo-zumba/rzrtdigital-platform.git /var/www/rzrt-app-prod
git clone --branch develop git@github.com:rodrigo-zumba/rzrtdigital-platform.git /var/www/rzrt-app-dev
```

Use uma **deploy key** do repositório (somente leitura) para o `git clone`,
não sua chave pessoal — GitHub → Settings → Deploy keys.

### 3. `.env.local` em cada diretório

Copie `.env.example` para `.env.local` em cada um dos dois diretórios e
preencha com os valores **reais e diferentes** por ambiente (banco, bucket,
Redis, chave do Resend — ver a matriz de recursos em `docs/AMBIENTES.md`).
Em `/var/www/rzrt-app-prod/.env.local`: `NODE_ENV=production`,
`APP_ENV=production`. Em `/var/www/rzrt-app-dev/.env.local`:
`NODE_ENV=production` (o Next.js força isso em qualquer `next build`/`next
start`, mesmo em dev — ver comentário em `.env.example`), `APP_ENV=development`.

**Nunca commitar esses arquivos.** Eles só existem no servidor.

### 4. Primeiro build manual + pm2

```bash
cd /var/www/rzrt-app-prod && pnpm install --frozen-lockfile && NODE_ENV=production pnpm exec prisma migrate deploy && pnpm build
cd /var/www/rzrt-app-dev  && pnpm install --frozen-lockfile && NODE_ENV=production pnpm exec prisma migrate deploy && pnpm build

# Da raiz de qualquer um dos dois (o ecosystem.config.cjs é o mesmo, versionado no repo):
pm2 start /var/www/rzrt-app-prod/ecosystem.config.cjs --only rzrt-app-prod
pm2 start /var/www/rzrt-app-dev/ecosystem.config.cjs --only rzrt-app-dev
pm2 save
pm2 startup   # segue a instrução impressa para o pm2 sobreviver a reboot
```

### 5. Nginx — dois server blocks

`/etc/nginx/sites-available/app.rzrtdigital.com`:

```nginx
server {
  listen 80;
  server_name app.rzrtdigital.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

`/etc/nginx/sites-available/dev.rzrtdigital.com` — igual, trocando
`server_name` para `dev.rzrtdigital.com` e `proxy_pass` para
`http://127.0.0.1:3002`. **Adicione também proteção de acesso** aqui
(`docs/AMBIENTES.md` — dev não pode ficar exposto sem barreira): a forma mais
simples é auth básica —

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd-dev seu-usuario
```

e dentro do `server` block do dev, antes do `location /`:

```nginx
auth_basic "Acesso restrito";
auth_basic_user_file /etc/nginx/.htpasswd-dev;
```

Depois:

```bash
sudo ln -s /etc/nginx/sites-available/app.rzrtdigital.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/dev.rzrtdigital.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d app.rzrtdigital.com -d dev.rzrtdigital.com
```

Confirme antes que o DNS de `app.` e `dev.` já apontam (registro A) para o IP
desta VPS — o certbot falha sem isso.

### 6. Secrets no GitHub (não aqui no chat)

Repositório → Settings → Secrets and variables → Actions → New repository
secret:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP ou hostname da VPS |
| `VPS_PORT` | porta do SSH (22, salvo se você mudou) |
| `VPS_USER` | usuário SSH usado no deploy |
| `VPS_SSH_KEY` | chave **privada** SSH dedicada ao deploy (gere uma nova só para isso, não reuse a sua pessoal; a pública vai em `~/.ssh/authorized_keys` do `VPS_USER` na VPS) |

## Como funciona depois de configurado

`.github/workflows/deploy.yml`: todo push em `main` ou `develop` roda a
Definition of Done completa (typecheck, lint, test com Postgres de serviço,
build) e, só se tudo passar, conecta via SSH e roda
`scripts/deploy-remote.sh prod` ou `scripts/deploy-remote.sh dev` — que faz
`git reset --hard` para o commit do push, `pnpm install`, `prisma migrate
deploy` (nunca `migrate dev`/`reset` — `docs/AMBIENTES.md`) e `pm2 reload`
(zero-downtime: só derruba a conexão depois que o novo processo já respondeu
health check).

Nenhum passo de deploy toca o banco fora de `migrate deploy`. Seed nunca roda
em nenhum dos dois ambientes da VPS.

## O que este documento não resolve

- Backup do Postgres (fora da VPS — configurar no provedor do banco).
- Rotação da deploy key / chave SSH de deploy.
- Monitoramento (Sentry) e alerta de queda do processo pm2.
