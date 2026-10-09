// PM2 process config — usado na VPS para manter o app no ar (restart automático em
// crash e no boot do servidor). Rode a partir da raiz do projeto: `pm2 start ecosystem.config.js`.
const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "vanilla-coffee",
      script: "npm",
      args: "run start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        UPLOADS_DIR: process.env.UPLOADS_DIR || path.join(__dirname, "storage", "uploads"),
      },
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "300M",
    },
  ],
};
