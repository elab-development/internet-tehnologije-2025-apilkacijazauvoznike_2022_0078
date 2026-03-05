import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { closeReopenKontejner } from "@/src/controllers/kontejner_controller";

export async function POST(req: Request) {
  const user = await requireUser();
  requireRole(user, ["UVOZNIK"]);

  const body = await req.json();
  const idKontejner = Number(body?.idKontejner);

  const res = await closeReopenKontejner(user.id, idKontejner);
  return NextResponse.json(res.json, { status: res.status });
}