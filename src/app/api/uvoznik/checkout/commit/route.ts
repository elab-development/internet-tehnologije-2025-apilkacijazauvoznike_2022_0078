import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { checkoutCommit } from "@/src/controllers/checkout_controller";

export async function POST(req: Request) {
  const user = await requireUser();
  requireRole(user, ["UVOZNIK"]);

  const body = await req.json();
  const res = await checkoutCommit(user.id, body);

  return NextResponse.json(res.json, { status: res.status });
}