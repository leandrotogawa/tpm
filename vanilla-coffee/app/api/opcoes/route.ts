import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function GET() {
  const grupos = await prisma.grupoOpcao.findMany({
    include: { opcoes: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(grupos);
}

export async function POST(request: Request) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const { nome, aplicaA, opcoes } = body as {
    nome: string;
    aplicaA: string;
    opcoes: string[];
  };

  if (!nome) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  const grupo = await prisma.grupoOpcao.create({
    data: {
      nome,
      aplicaA: aplicaA ?? "",
      opcoes: {
        create: (opcoes ?? []).filter(Boolean).map((n) => ({ nome: n })),
      },
    },
    include: { opcoes: true },
  });

  return NextResponse.json(grupo, { status: 201 });
}
