#!/usr/bin/env bash
# Empacota o projeto e envia pra VPS via scp/ssh (sem depender de git).
# Uso: preencha VPS_USER/VPS_HOST/VPS_PATH abaixo (ou exporte como variáveis de
# ambiente antes de rodar) e execute a partir de qualquer lugar:
#   bash deploy/deploy.sh
#
# Requer: acesso SSH por chave já configurado para o usuário/host da VPS
# (`ssh usuario@host` funcionando sem pedir senha).
set -euo pipefail

VPS_USER="${VPS_USER:-deploy}"
VPS_HOST="${VPS_HOST:-seu-servidor.exemplo.com}"
VPS_PATH="${VPS_PATH:-/home/deploy/vanilla-coffee}"

cd "$(dirname "$0")/.."   # raiz do projeto (deploy/ está um nível abaixo)

TARBALL="/tmp/vanilla-coffee-release.tar.gz"

echo "==> Empacotando o projeto (sem node_modules, .next, .env, banco e uploads)..."
tar czf "$TARBALL" \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=.env \
  --exclude=.env.local \
  --exclude=prisma/dev.db \
  --exclude=prisma/dev.db-journal \
  --exclude=public/uploads \
  --exclude=app/generated \
  .

echo "==> Enviando para $VPS_USER@$VPS_HOST:$VPS_PATH ..."
scp "$TARBALL" "$VPS_USER@$VPS_HOST:/tmp/"

echo "==> Instalando e reiniciando na VPS..."
ssh "$VPS_USER@$VPS_HOST" bash -s <<EOF
set -e
mkdir -p "$VPS_PATH"
tar xzf /tmp/vanilla-coffee-release.tar.gz -C "$VPS_PATH"
mkdir -p "$VPS_PATH/public/uploads"
cd "$VPS_PATH"

if [ ! -f .env ]; then
  echo "AVISO: .env não encontrado em $VPS_PATH — crie antes de continuar (veja README)." >&2
  exit 1
fi

npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

if pm2 describe vanilla-coffee > /dev/null 2>&1; then
  pm2 restart vanilla-coffee
else
  pm2 start ecosystem.config.js
fi
pm2 save

rm -f /tmp/vanilla-coffee-release.tar.gz
EOF

rm -f "$TARBALL"
echo "==> Deploy concluído."
