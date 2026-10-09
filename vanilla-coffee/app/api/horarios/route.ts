import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

const DEFAULT_HORARIOS = [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
  diaSemana,
  aberto: diaSemana !== 0, // domingo fechado
  horaAbre: "08:00",
  horaFecha: "20:00",
}));

async function getOrCreateHorarios() {
  const existing = await prisma.horarioFuncionamento.findMany({
    orderBy: { diaSemana: "asc" },
  });
  if (existing.length === 7) return existing;

  await prisma.$transaction(
    DEFAULT_HORARIOS.map((h) =>
      prisma.horarioFuncionamento.upsert({
        where: { diaSemana: h.diaSemana },
        create: h,
        update: {},
      })
    )
  );
  return prisma.horarioFuncionamento.findMany({ orderBy: { diaSemana: "asc" } });
}

export async function GET() {
  const horarios = await getOrCreateHorarios();
  return NextResponse.json(horarios);
}

export async function PATCH(request: Request) {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body: Array<{
    diaSemana: number;
    aberto: boolean;
    horaAbre: string;
    horaFecha: string;
  }> = await request.json();

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }

  await prisma.$transaction(
    body.map((h) =>
      prisma.horarioFuncionamento.upsert({
        where: { diaSemana: h.diaSemana },
        create: h,
        update: {
          aberto: h.aberto,
          horaAbre: h.horaAbre,
          horaFecha: h.horaFecha,
        },
      })
    )
  );

  const horarios = await prisma.horarioFuncionamento.findMany({
    orderBy: { diaSemana: "asc" },
  });
  return NextResponse.json(horarios);
}
