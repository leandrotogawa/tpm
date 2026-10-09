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
  for (const field of ["nome", "aplicaA", "preco", "ativo"] as const) {
    if (field in body) data[field] = body[field];
  }

  const complemento = await prisma.complemento.update({ where: { id }, data });
  return NextResponse.json(complemento);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  await prisma.complemento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
