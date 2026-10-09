import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** Returns the session, or an unauthorized NextResponse to return early from a route handler. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      unauthorized: NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      ),
    };
  }
  return { session, unauthorized: null };
}
