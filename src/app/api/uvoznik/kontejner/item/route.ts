import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { updateStavkaDelta } from "@/src/controllers/kontejner_controller";

export async function PATCH(req: Request) {
  const user = await requireUser();
  requireRole(user, ["UVOZNIK"]);

  const body = await req.json();
  const res = await updateStavkaDelta(body, user.id);
  return NextResponse.json(res.json, { status: res.status });
}