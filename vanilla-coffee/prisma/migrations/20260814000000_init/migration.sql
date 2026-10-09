-- CreateTable
CREATE TABLE "Estabelecimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL DEFAULT 'Vanilla Coffee',
    "descricao" TEXT,
    "cnpj" TEXT,
    "corMenu" TEXT NOT NULL DEFAULT '#6B0E0E',
    "logoUrl" TEXT,
    "instagram" TEXT,
    "whatsapp" TEXT,
    "telefone" TEXT
);

-- CreateTable
CREATE TABLE "HorarioFuncionamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diaSemana" INTEGER NOT NULL,
    "aberto" BOOLEAN NOT NULL DEFAULT true,
    "horaAbre" TEXT NOT NULL DEFAULT '08:00',
    "horaFecha" TEXT NOT NULL DEFAULT '20:00'
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "preco" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "controlaEstoque" BOOLEAN NOT NULL DEFAULT true,
    "corIcone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Estoque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produtoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Complemento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "aplicaA" TEXT NOT NULL,
    "preco" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "GrupoOpcao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "aplicaA" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Opcao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "grupoOpcaoId" TEXT NOT NULL,
    CONSTRAINT "Opcao_grupoOpcaoId_fkey" FOREIGN KEY ("grupoOpcaoId") REFERENCES "GrupoOpcao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "cliente" TEXT NOT NULL DEFAULT 'Cliente não identificado',
    "tipoConsumo" TEXT NOT NULL,
    "canal" TEXT NOT NULL DEFAULT 'Cardápio digital',
    "status" TEXT NOT NULL DEFAULT 'Em preparo',
    "subtotal" REAL NOT NULL,
    "total" REAL NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pedidoId" TEXT NOT NULL,
    "nomeSnapshot" TEXT NOT NULL,
    "precoSnapshot" REAL NOT NULL,
    "quantidade" INTEGER NOT NULL,
    CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfigPagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pix" BOOLEAN NOT NULL DEFAULT true,
    "dinheiro" BOOLEAN NOT NULL DEFAULT true,
    "credito" BOOLEAN NOT NULL DEFAULT true,
    "debito" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "ConfigNotificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "novoPedidoWhatsapp" BOOLEAN NOT NULL DEFAULT true,
    "somAlertaPainel" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "HorarioFuncionamento_diaSemana_key" ON "HorarioFuncionamento"("diaSemana");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_produtoId_key" ON "Estoque"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");
