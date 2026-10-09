import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ produtoId: string }> }
) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { produtoId } = await params;
  const body = await request.json();
  const { delta, quantidade } = body as { delta?: number; quantidade?: number };

  const estoque = await prisma.$transaction(async (tx) => {
    const atual = await tx.estoque.findUnique({ where: { produtoId } });
    const novaQuantidade =
      quantidade != null
        ? Math.max(0, quantidade)
        : Math.max(0, (atual?.quantidade ?? 0) + (delta ?? 0));

    return tx.estoque.upsert({
      where: { produtoId },
      create: { produtoId, quantidade: novaQuantidade },
      update: { quantidade: novaQuantidade },
    });
  });

  return NextResponse.json(estoque);
}
