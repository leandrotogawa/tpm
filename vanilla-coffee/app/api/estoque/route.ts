import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

export async function GET() {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const produtos = await prisma.produto.findMany({
    include: { estoque: true },
    orderBy: [{ categoria: "asc" }, { nome: "asc" }],
  });
  return NextResponse.json(produtos);
}
