import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { CAIXINHA_PRECO, CAIXINHA_QTD, TIPOS_CONSUMO } from "@/lib/constants";

const FORMAS_PAGAMENTO = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
} as const;

export async function GET(request: Request) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const pedidos = await prisma.pedido.findMany({
    where: q
      ? {
          OR: [
            { cliente: { contains: q } },
            ...(Number.isFinite(Number(q)) && q !== ""
              ? [{ numero: Number(q) }]
              : []),
          ],
        }
      : undefined,
    include: { itens: true },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(pedidos);
}

type ItemInput =
  | { tipo: "produto"; produtoId: string; quantidade: number }
  | { tipo: "caixinha"; sabores: { produtoId: string; quantidade: number }[] };

class PedidoError extends Error {}

export async function POST(request: Request) {
  const body = await request.json();
  const { cliente, tipoConsumo, formaPagamento, itens } = body as {
    cliente?: string;
    tipoConsumo: string;
    formaPagamento?: string;
    itens: ItemInput[];
  };

  if (!TIPOS_CONSUMO.includes(tipoConsumo as (typeof TIPOS_CONSUMO)[number])) {
    return NextResponse.json(
      { error: "Tipo de consumo inválido." },
      { status: 400 }
    );
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return NextResponse.json(
      { error: "O pedido precisa ter ao menos um item." },
      { status: 400 }
    );
  }

  const configPagamento = await prisma.configPagamento.findFirst();
  const formasDisponiveis = [
    configPagamento?.pix !== false ? FORMAS_PAGAMENTO.pix : null,
    configPagamento?.dinheiro !== false ? FORMAS_PAGAMENTO.dinheiro : null,
    configPagamento?.credito !== false ? FORMAS_PAGAMENTO.credito : null,
    configPagamento?.debito ? FORMAS_PAGAMENTO.debito : null,
  ].filter(Boolean) as string[];

  if (!formaPagamento || !formasDisponiveis.includes(formaPagamento)) {
    return NextResponse.json(
      { error: "Selecione uma forma de pagamento válida." },
      { status: 400 }
    );
  }

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const itensParaCriar: {
        nomeSnapshot: string;
        precoSnapshot: number;
        quantidade: number;
      }[] = [];

      for (const item of itens) {
        if (item.tipo === "produto") {
          const produto = await tx.produto.findUnique({
            where: { id: item.produtoId },
            include: { estoque: true },
          });
          if (!produto || !produto.ativo) {
            throw new PedidoError("Produto indisponível.");
          }
          if (item.quantidade <= 0) {
            throw new PedidoError("Quantidade inválida.");
          }
          if (produto.controlaEstoque) {
            const disponivel = produto.estoque?.quantidade ?? 0;
            if (disponivel < item.quantidade) {
              throw new PedidoError(`${produto.nome} está esgotado.`);
            }
            await tx.estoque.update({
              where: { produtoId: produto.id },
              data: { quantidade: disponivel - item.quantidade },
            });
          }
          itensParaCriar.push({
            nomeSnapshot: produto.nome,
            precoSnapshot: produto.preco,
            quantidade: item.quantidade,
          });
        } else if (item.tipo === "caixinha") {
          const totalUnidades = item.sabores.reduce(
            (sum, s) => sum + s.quantidade,
            0
          );
          if (totalUnidades !== CAIXINHA_QTD) {
            throw new PedidoError(
              `A caixinha precisa ter exatamente ${CAIXINHA_QTD} unidades.`
            );
          }

          const nomesEscolhidos: string[] = [];
          for (const sabor of item.sabores) {
            if (sabor.quantidade <= 0) continue;
            const produto = await tx.produto.findUnique({
              where: { id: sabor.produtoId },
              include: { estoque: true },
            });
            if (!produto || !produto.ativo || produto.categoria !== "Donuts") {
              throw new PedidoError("Sabor de donut inválido.");
            }
            if (produto.controlaEstoque) {
              const disponivel = produto.estoque?.quantidade ?? 0;
              if (disponivel < sabor.quantidade) {
                throw new PedidoError(`${produto.nome} está esgotado.`);
              }
              await tx.estoque.update({
                where: { produtoId: produto.id },
                data: { quantidade: disponivel - sabor.quantidade },
              });
            }
            nomesEscolhidos.push(`${sabor.quantidade}x ${produto.nome}`);
          }

          itensParaCriar.push({
            nomeSnapshot: `Caixinha (${nomesEscolhidos.join(", ")})`,
            precoSnapshot: CAIXINHA_PRECO,
            quantidade: 1,
          });
        } else {
          throw new PedidoError("Item de pedido inválido.");
        }
      }

      const total = itensParaCriar.reduce(
        (sum, i) => sum + i.precoSnapshot * i.quantidade,
        0
      );

      const ultimo = await tx.pedido.findFirst({ orderBy: { numero: "desc" } });
      const numero = (ultimo?.numero ?? 1000) + 1;

      return tx.pedido.create({
        data: {
          numero,
          cliente: cliente?.trim() || undefined,
          tipoConsumo,
          formaPagamento,
          subtotal: total,
          total,
          itens: { create: itensParaCriar },
        },
        include: { itens: true },
      });
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (err) {
    if (err instanceof PedidoError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
