/**
 * PM2 (docs/DEPLOY-HOSTINGER.md): mantém os dois ambientes rodando como
 * processos Node persistentes na mesma VPS. Cada app tem seu próprio
 * diretório de deploy e seu próprio .env — nunca compartilhado (CLAUDE.md
 * §2, topologia; docs/AMBIENTES.md, matriz de recursos por ambiente).
 */
module.exports = {
  apps: [
    {
      name: "rzrt-app-prod",
      cwd: "/var/www/rzrt-app-prod",
      script: "node_modules/.bin/next",
      args: "start -p 3001",
      env: { NODE_ENV: "production" },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
    },
    {
      name: "rzrt-app-dev",
      cwd: "/var/www/rzrt-app-dev",
      script: "node_modules/.bin/next",
      args: "start -p 3002",
      env: { NODE_ENV: "production" },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
