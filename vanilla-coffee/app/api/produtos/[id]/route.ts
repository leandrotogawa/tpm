import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  for (const field of [
    "nome",
    "descricao",
    "imagemUrl",
    "emPromocao",
    "categoria",
    "preco",
    "ativo",
    "controlaEstoque",
    "corIcone",
    "ordem",
  ] as const) {
    if (field in body) data[field] = body[field];
  }

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data,
      include: { estoque: true },
    });

    return NextResponse.json(produto);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Erro ao atualizar produto.";
    const message = /Unknown argument\s+`?(emPromocao|imagemUrl)`?/i.test(rawMessage)
      ? "Seu banco/Prisma ainda não foi atualizado para os novos campos. Rode: npm run db:init && npx prisma generate"
      : rawMessage;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await prisma.produto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
