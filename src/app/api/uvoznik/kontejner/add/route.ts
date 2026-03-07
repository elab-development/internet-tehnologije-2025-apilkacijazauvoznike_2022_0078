import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { addToKontejner } from "@/src/controllers/kontejner_controller";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const user = await requireUser();
  requireRole(user, ["UVOZNIK"]);

  const body = await req.json();

  const res = await addToKontejner({
    ...body,
    uvoznikId: user.id,
  });

  return NextResponse.json(res.json, { status: res.status });
}