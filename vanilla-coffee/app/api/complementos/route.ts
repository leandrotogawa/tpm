import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function GET() {
  const complementos = await prisma.complemento.findMany({
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(complementos);
}

export async function POST(request: Request) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const { nome, aplicaA, preco, ativo } = body;

  if (!nome || typeof preco !== "number") {
    return NextResponse.json(
      { error: "Nome e preço são obrigatórios." },
      { status: 400 }
    );
  }

  const complemento = await prisma.complemento.create({
    data: { nome, aplicaA: aplicaA ?? "", preco, ativo: ativo ?? true },
  });

  return NextResponse.json(complemento, { status: 201 });
}
