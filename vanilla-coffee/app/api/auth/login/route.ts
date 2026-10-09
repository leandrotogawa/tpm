import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUsername || !adminPasswordHash) {
    return NextResponse.json(
      { error: "Login não configurado no servidor." },
      { status: 500 }
    );
  }

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username !== adminUsername ||
    !(await bcrypt.compare(password, adminPasswordHash))
  ) {
    return NextResponse.json(
      { error: "Usuário ou senha inválidos." },
      { status: 401 }
    );
  }

  await createSession(username);
  return NextResponse.json({ ok: true });
}
