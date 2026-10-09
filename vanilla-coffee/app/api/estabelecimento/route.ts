import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

async function getOrCreateEstabelecimento() {
  const existing = await prisma.estabelecimento.findFirst();
  if (existing) return existing;
  return prisma.estabelecimento.create({ data: {} });
}

export async function GET() {
  const estabelecimento = await getOrCreateEstabelecimento();
  return NextResponse.json(estabelecimento);
}

export async function PATCH(request: Request) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const estabelecimento = await getOrCreateEstabelecimento();

  const data: Record<string, unknown> = {};
  for (const field of [
    "nome",
    "descricao",
    "cnpj",
    "corMenu",
    "logoUrl",
    "capaUrl",
    "instagram",
    "whatsapp",
    "telefone",
  ] as const) {
    if (field in body) data[field] = body[field];
  }

  if ("whatsapp" in data) {
    data.whatsapp = normalizeWhatsappNumber(typeof data.whatsapp === "string" ? data.whatsapp : "");
  }

  const updated = await prisma.estabelecimento.update({
    where: { id: estabelecimento.id },
    data,
  });
  return NextResponse.json(updated);
}
