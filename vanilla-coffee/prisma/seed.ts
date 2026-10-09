import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const jaSemeado = await prisma.estabelecimento.findFirst();
  if (jaSemeado) {
    console.log("Banco já contém dados — seed ignorado.");
    return;
  }

  await prisma.estabelecimento.create({
    data: {
      nome: "Vanilla Coffee",
      descricao:
        "Doces, café e momentos que combinam. Donuts artesanais, fatias de bolo generosas e cappuccino gelado feitos com carinho.",
      corMenu: "#6B0E0E",
      instagram: "@vanillacoffee.oficial",
      // TODO: troque pelo número real do WhatsApp da loja (DDI+DDD+número, só dígitos)
      whatsapp: "5500000000000",
    },
  });

  await prisma.configPagamento.create({
    data: { pix: true, dinheiro: true, credito: true, debito: false },
  });

  await prisma.configNotificacao.create({
    data: { novoPedidoWhatsapp: true, somAlertaPainel: true },
  });

  await prisma.horarioFuncionamento.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
      diaSemana,
      aberto: diaSemana !== 0,
      horaAbre: "08:00",
      horaFecha: "20:00",
    })),
  });

  const donuts = [
    { nome: "Donut Oreo", corIcone: "#3B2A22" },
    { nome: "Donut Paçoca", corIcone: "#C9975B" },
    { nome: "Donut M&M", corIcone: "#6B4226" },
    { nome: "Donut Chocolate", corIcone: "#4A2A1D" },
  ];
  for (const [i, d] of donuts.entries()) {
    await prisma.produto.create({
      data: {
        nome: d.nome,
        categoria: "Donuts",
        preco: 3.5,
        corIcone: d.corIcone,
        ordem: i,
        estoque: { create: { quantidade: 75 } },
      },
    });
  }

  await prisma.produto.create({
    data: {
      nome: "Caixinha (4 donuts)",
      categoria: "Combos",
      preco: 8,
      controlaEstoque: false,
      descricao: "Monte com 4 donuts, misturando os sabores que quiser.",
    },
  });

  const fatias = [
    { nome: "Fatia Ninho", base: "#EFCB8E" },
    { nome: "Fatia Nutella", base: "#5C3A22" },
  ];
  for (const [i, f] of fatias.entries()) {
    await prisma.produto.create({
      data: {
        nome: f.nome,
        categoria: "Fatias",
        preco: 18,
        corIcone: f.base,
        ordem: i,
        estoque: { create: { quantidade: 20 } },
      },
    });
  }

  await prisma.produto.create({
    data: {
      nome: "Cappuccino Gelado 200ml",
      categoria: "Bebidas",
      preco: 12,
      controlaEstoque: false,
      ordem: 0,
    },
  });
  await prisma.produto.create({
    data: {
      nome: "Cappuccino Gelado 300ml",
      categoria: "Bebidas",
      preco: 16,
      controlaEstoque: false,
      ordem: 1,
    },
  });

  await prisma.complemento.createMany({
    data: [
      { nome: "Cobertura extra de chocolate", aplicaA: "Donuts, Fatias", preco: 2 },
      { nome: "Chantilly extra", aplicaA: "Cappuccino Gelado", preco: 2 },
      { nome: "Granulado colorido", aplicaA: "Donuts", preco: 1.5 },
      { nome: "Raspas de chocolate", aplicaA: "Cappuccino Gelado, Fatias", preco: 1.5 },
    ],
  });

  await prisma.grupoOpcao.create({
    data: {
      nome: "Tamanho",
      aplicaA: "Cappuccino Gelado",
      opcoes: { create: [{ nome: "200ml" }, { nome: "300ml" }] },
    },
  });
  await prisma.grupoOpcao.create({
    data: {
      nome: "Sabor do Donut",
      aplicaA: "Donuts, Caixinha",
      opcoes: {
        create: [
          { nome: "Oreo" },
          { nome: "Paçoca" },
          { nome: "M&M" },
          { nome: "Chocolate" },
        ],
      },
    },
  });
  await prisma.grupoOpcao.create({
    data: {
      nome: "Sabor da Fatia",
      aplicaA: "Fatias de Bolo",
      opcoes: { create: [{ nome: "Ninho" }, { nome: "Nutella" }] },
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
