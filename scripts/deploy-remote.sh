#!/usr/bin/env bash
# Executado NA VPS pelo GitHub Actions via SSH (docs/DEPLOY-HOSTINGER.md).
# Uso: ./deploy-remote.sh <prod|dev>
set -euo pipefail

TARGET="${1:?Uso: deploy-remote.sh <prod|dev>}"

case "$TARGET" in
  prod)
    APP_DIR="/var/www/rzrt-app-prod"
    BRANCH="main"
    PM2_NAME="rzrt-app-prod"
    ;;
  dev)
    APP_DIR="/var/www/rzrt-app-dev"
    BRANCH="develop"
    PM2_NAME="rzrt-app-dev"
    ;;
  *)
    echo "✖ Alvo inválido: $TARGET (use 'prod' ou 'dev')" >&2
    exit 1
    ;;
esac

echo "→ Deploy [$TARGET] em $APP_DIR (branch $BRANCH)"
cd "$APP_DIR"

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

pnpm install --frozen-lockfile

# Único passo de release permitido em produção (CLAUDE.md §4.11,
# docs/AMBIENTES.md): nunca migrate dev, nunca migrate reset, nunca seed.
NODE_ENV=production pnpm exec prisma migrate deploy

pnpm build

pm2 reload "$PM2_NAME" --update-env

echo "✓ Deploy [$TARGET] concluído."
