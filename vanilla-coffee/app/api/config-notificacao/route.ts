import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

async function getOrCreate() {
  const existing = await prisma.configNotificacao.findFirst();
  if (existing) return existing;
  return prisma.configNotificacao.create({ data: {} });
}

export async function GET() {
  return NextResponse.json(await getOrCreate());
}

export async function PATCH(request: Request) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const config = await getOrCreate();

  const data: Record<string, unknown> = {};
  for (const field of ["novoPedidoWhatsapp", "somAlertaPainel"] as const) {
    if (field in body) data[field] = body[field];
  }

  const updated = await prisma.configNotificacao.update({
    where: { id: config.id },
    data,
  });
  return NextResponse.json(updated);
}
