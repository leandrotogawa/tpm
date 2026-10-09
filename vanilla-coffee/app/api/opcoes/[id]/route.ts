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
  const { nome, aplicaA, opcoes } = body as {
    nome?: string;
    aplicaA?: string;
    opcoes?: string[];
  };

  await prisma.$transaction(async (tx) => {
    await tx.grupoOpcao.update({
      where: { id },
      data: {
        ...(nome != null ? { nome } : {}),
        ...(aplicaA != null ? { aplicaA } : {}),
      },
    });

    if (opcoes) {
      await tx.opcao.deleteMany({ where: { grupoOpcaoId: id } });
      await tx.opcao.createMany({
        data: opcoes.filter(Boolean).map((n) => ({ nome: n, grupoOpcaoId: id })),
      });
    }
  });

  const grupo = await prisma.grupoOpcao.findUnique({
    where: { id },
    include: { opcoes: true },
  });
  return NextResponse.json(grupo);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await prisma.grupoOpcao.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
