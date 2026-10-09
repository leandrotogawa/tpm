import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");
  const ativoParam = searchParams.get("ativo");

  const produtos = await prisma.produto.findMany({
    where: {
      ...(categoria && categoria !== "Todos" ? { categoria } : {}),
      ...(ativoParam != null ? { ativo: ativoParam === "true" } : {}),
    },
    include: { estoque: true },
    orderBy: [{ categoria: "asc" }, { ordem: "asc" }, { criadoEm: "asc" }],
  });

  return NextResponse.json(produtos);
}

export async function POST(request: Request) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const {
    nome,
    descricao,
    imagemUrl,
    emPromocao,
    categoria,
    preco,
    ativo,
    controlaEstoque,
    corIcone,
    ordem,
    quantidadeInicial,
  } = body;

  if (!nome || !categoria || typeof preco !== "number") {
    return NextResponse.json(
      { error: "Nome, categoria e preço são obrigatórios." },
      { status: 400 }
    );
  }

  try {
    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao: descricao ?? null,
        imagemUrl: imagemUrl ?? null,
        emPromocao: emPromocao ?? false,
        categoria,
        preco,
        ativo: ativo ?? true,
        controlaEstoque: controlaEstoque ?? true,
        corIcone: corIcone ?? null,
        ordem: ordem ?? 0,
        ...(controlaEstoque !== false
          ? { estoque: { create: { quantidade: quantidadeInicial ?? 0 } } }
          : {}),
      },
      include: { estoque: true },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Erro ao criar produto.";
    const message = /Unknown argument\s+`?(emPromocao|imagemUrl)`?/i.test(rawMessage)
      ? "Seu banco/Prisma ainda não foi atualizado para os novos campos. Rode: npm run db:init && npx prisma generate"
      : rawMessage;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
