import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { STATUS_PEDIDO } from "@/lib/constants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const { status } = await request.json();

  if (!STATUS_PEDIDO.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const pedido = await prisma.pedido.update({
    where: { id },
    data: { status },
    include: { itens: true },
  });

  return NextResponse.json(pedido);
}
