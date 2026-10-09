# Vanilla Coffee

Cardápio digital + painel administrativo da Vanilla Coffee, em Next.js (App Router) + TypeScript + Prisma/SQLite.

- **`/`** — cardápio do cliente (carrinho, monte sua caixinha, checkout via WhatsApp).
- **`/painel`** — painel do lojista (Perfil, Pedidos, Produtos, Complementos, Opções, Estoque, Configurações), atrás de login.

## Stack

- Next.js 16 (App Router, Route Handlers) + TypeScript
- Prisma 7 + SQLite (via driver adapter `@prisma/adapter-better-sqlite3` — veja nota abaixo)
- CSS Modules portados 1:1 do visual aprovado nos protótipos
- Sessão do painel: cookie httpOnly assinado com `jose` (JWT), senha com `bcryptjs`
- Upload de logo salvo em `/public/uploads`

## Setup

```bash
npm install
cp .env.example .env
```

Preencha o `.env`:

```bash
# gere um segredo de sessão
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# gere o hash da senha do painel
node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA', 10))"
```

> **Atenção:** ao colar o hash gerado em `ADMIN_PASSWORD_HASH`, escape todo `$` como `\$` (ex.: `\$2b\$10\$...`). O carregador de `.env` do Next.js expande `$VAR` no estilo shell, e sem o escape ele corrompe o hash bcrypt silenciosamente (o login passa a falhar com "usuário ou senha inválidos" mesmo com a senha certa).

Crie o banco e rode o seed:

```bash
npm run db:init   # aplica prisma/migrations em prisma/dev.db
npm run db:seed   # popula produtos, estoque, horários etc.
```

Rode o projeto:

```bash
npm run dev
```

- Cardápio: http://localhost:3000
- Painel: http://localhost:3000/painel (login com o `ADMIN_USERNAME`/senha configurados no `.env`)

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Caminho do arquivo SQLite (`file:./prisma/dev.db`) |
| `SESSION_SECRET` | Segredo para assinar o cookie de sessão do painel |
| `ADMIN_USERNAME` | Usuário único do lojista |
| `ADMIN_PASSWORD_HASH` | Hash bcrypt da senha do lojista |

## Estrutura

```
app/
  page.tsx                 cardápio digital (cliente)
  painel/
    login/page.tsx         tela de login
    page.tsx                shell do painel (sidebar + seções)
    _components/            seções do painel (Perfil, Pedidos, Produtos...)
  api/                      route handlers (produtos, pedidos, estoque, auth...)
  generated/prisma/         cliente Prisma gerado (não versionado)
components/
  ProductIcons.tsx          ícones SVG dos produtos (donut/fatia/copo)
lib/
  prisma.ts, session.ts, auth.ts, guard.ts   infra (DB, sessão, auth)
  constants.ts, types.ts, open-now.ts, stock-status.ts
prisma/
  schema.prisma, migrations/, seed.ts
proxy.ts                    protege as rotas /painel/* (login obrigatório)
```

## Nota sobre Prisma no Windows

Este projeto usa Prisma 7 com um **driver adapter** (`@prisma/adapter-better-sqlite3`), então o cliente Prisma em tempo de execução não depende do binário nativo do "schema engine" — ele conversa com o SQLite diretamente via `better-sqlite3` (um addon Node carregado no processo, não um executável separado).

Isso importa porque, em algumas máquinas Windows, uma política de Controle de Aplicativo (Smart App Control / WDAC) bloqueia a execução do `schema-engine-windows.exe` que os comandos `prisma migrate dev` / `db push` usam — o erro aparece como *"Uma política de Controle de Aplicativo bloqueou este arquivo"*. Por isso este repo usa um caminho alternativo:

- `prisma/migrations/*/migration.sql` guarda o SQL de cada migração normalmente (versionado, igual a um projeto Prisma padrão).
- `npm run db:init` (`scripts/init-db.mjs`) aplica esse SQL diretamente no `prisma/dev.db` via `better-sqlite3` e registra a migração em `_prisma_migrations`, para o banco ficar no mesmo estado que `prisma migrate deploy` deixaria.

Se sua máquina **não** tiver essa restrição (a maioria não tem — isso é raro fora de ambientes corporativos travados), os comandos padrão do Prisma (`npx prisma migrate dev`, `npx prisma studio` etc.) funcionam normalmente também. Em produção (Vercel/Linux) isso nunca é um problema.

## Seed

`prisma/seed.ts` popula:

- Estabelecimento "Vanilla Coffee", cor `#6B0E0E`, Instagram `@vanillacoffee.oficial`
- Produtos: 4 sabores de donut (R$ 3,50, 75un cada), Caixinha 4 donuts (R$ 8,00), Fatia Ninho/Nutella (R$ 18,00, 20un cada), Cappuccino Gelado 200ml/300ml (R$ 12/16, feito na hora)
- Complementos sugeridos, grupos de opção (Tamanho, Sabor do Donut, Sabor da Fatia)
- Horário: segunda a sábado 08:00–20:00, domingo fechado

Roda apenas uma vez (idempotente — se já existir um Estabelecimento no banco, o seed não faz nada).

## Pontos em aberto (sinalizados no código)

- Número real do WhatsApp: hoje é o placeholder `5500000000000` — troque em **Painel → Perfil → WhatsApp**.
- Valor real do cappuccino 200ml/300ml (hoje é uma estimativa).
- Regra exata do combo 3 (2º cappuccino) — os cards de Combos no cardápio são só informativos, sem lógica de desconto automática.
- Lista real de complementos — os cadastrados são sugestões, edite em **Painel → Complementos**.

## Deploy em VPS (Ubuntu/Debian)

SQLite continua funcionando bem em produção numa VPS (ao contrário de plataformas serverless tipo Vercel) — não precisa migrar pra Postgres pra isso. O fluxo abaixo assume um servidor Ubuntu/Debian já provisionado, com acesso SSH por chave, e o código sendo enviado da sua máquina via `scp`/`tar` (sem depender de Git).

### 1. Preparar a VPS (uma vez só)

Instale Node.js 22 LTS, PM2 (mantém o app rodando e reinicia sozinho), Nginx (proxy reverso) e Certbot (HTTPS grátis):

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
sudo apt-get install -y certbot python3-certbot-nginx
```

Crie o usuário/pasta que vai rodar o app (troque `deploy` pelo usuário que preferir):

```bash
sudo useradd -m -s /bin/bash deploy   # pule se já tiver um usuário pra isso
sudo mkdir -p /home/deploy/vanilla-coffee
sudo chown -R deploy:deploy /home/deploy/vanilla-coffee
```

Garanta que sua chave SSH pública está em `~deploy/.ssh/authorized_keys` (pra `ssh deploy@sua-vps` funcionar sem senha — necessário pro script de deploy).

### 2. Primeiro envio do código

Da sua máquina (Windows, usando o Git Bash — já tem `tar`/`scp`), na raiz do projeto:

```bash
export VPS_USER=deploy
export VPS_HOST=seu-ip-ou-dominio
export VPS_PATH=/home/deploy/vanilla-coffee
bash deploy/deploy.sh
```

Na primeira execução ele vai reclamar que falta o `.env` na VPS — é esperado, o `deploy.sh` nunca envia esse arquivo (ele fica de fora do pacote de propósito, pra nunca sobrescrever segredos de produção). Mas essa primeira falha já deixa a pasta `/home/deploy/vanilla-coffee` criada na VPS, então dá pra colocar o `.env` de duas formas:

**Opção A — copiar da sua máquina (recomendado, evita erro de digitação):**

Monte um `.env` de produção *localmente* primeiro — **não** copie o `.env` de desenvolvimento, ele tem a senha de teste (`vanilla123`) e o WhatsApp placeholder. Crie um arquivo separado, por exemplo `.env.production` na raiz do projeto (não vai ser commitado, mas pra garantir confira se `.env*` está no `.gitignore` — já está):

```bash
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="<gere novo: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\">"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="<hash bcrypt da senha real — lembre de escapar os $ como \$, veja acima>"
```

Depois copie esse arquivo pra VPS, já renomeando pra `.env` no destino:

```bash
scp .env.production deploy@seu-ip-ou-dominio:/home/deploy/vanilla-coffee/.env
ssh deploy@seu-ip-ou-dominio "chmod 600 /home/deploy/vanilla-coffee/.env"
```

(o `chmod 600` deixa o arquivo legível só pelo dono — boa prática pra um arquivo com segredos). Depois pode apagar o `.env.production` local se preferir não deixar duas cópias por aí.

**Opção B — editar direto na VPS:**

```bash
ssh deploy@seu-ip-ou-dominio
cd /home/deploy/vanilla-coffee
nano .env
```

e cola o mesmo conteúdo do bloco acima.

Rode `bash deploy/deploy.sh` de novo (agora da sua máquina) — ele instala dependências, gera o client do Prisma, aplica as migrações (`prisma migrate deploy` — funciona liso no Linux, sem o workaround que este projeto usa no Windows), builda e sobe o app via PM2. Depois popule os dados iniciais (só na primeira vez):

```bash
ssh deploy@seu-ip-ou-dominio "cd /home/deploy/vanilla-coffee && npm run db:seed"
pm2 startup   # segue as instruções impressas pra o PM2 sobreviver a um reboot da VPS
```

### 3. Domínio + HTTPS

Aponte o DNS do seu domínio (registro A) pro IP da VPS. Depois, na VPS:

```bash
sudo cp /home/deploy/vanilla-coffee/deploy/nginx.conf.example /etc/nginx/sites-available/vanilla-coffee
sudo nano /etc/nginx/sites-available/vanilla-coffee   # troque SEU_DOMINIO.com.br
sudo ln -s /etc/nginx/sites-available/vanilla-coffee /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

O Certbot edita o site do Nginx pra servir HTTPS e renova o certificado sozinho. Libere as portas necessárias no firewall se ainda não estiverem:

```bash
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

### 4. Atualizações seguintes

É só rodar de novo, da sua máquina:

```bash
bash deploy/deploy.sh
```

O script empacota o código (sem `node_modules`, `.next`, `.env`, o banco `prisma/dev.db` nem `public/uploads` — esses três ficam intactos na VPS), envia, reinstala dependências, aplica migrações novas, builda e reinicia o processo no PM2. `.env`, o banco SQLite e as logos enviadas nunca são sobrescritos por um deploy.

### 5. Dados e backup

O estado que importa está todo em `prisma/dev.db` (pedidos, produtos, estoque, configurações) e `public/uploads/` (logo) — nada disso é recriado num deploy, mas também não é gerado automaticamente pela plataforma como seria num serviço gerenciado. Vale colocar um cron simples pra copiar os dois pra fora da VPS de tempos em tempos:

```bash
# na VPS, ex. crontab -e:
0 3 * * * tar czf /home/deploy/backups/vc-$(date +\%F).tar.gz -C /home/deploy/vanilla-coffee prisma/dev.db public/uploads
```

### Alternativa: Postgres / Vercel

Se preferir hospedar em uma plataforma serverless (Vercel) em vez de VPS, SQLite não serve (sem disco persistente) — troque `DATABASE_URL` para Postgres, adicione o driver adapter correspondente (`@prisma/adapter-pg`, por exemplo) em `lib/prisma.ts` e `prisma/seed.ts`, e rode `npx prisma migrate deploy`. O upload de logo também precisaria ir para um storage externo (S3, Vercel Blob etc.) em vez de `/public/uploads`, que não persiste em serverless.
