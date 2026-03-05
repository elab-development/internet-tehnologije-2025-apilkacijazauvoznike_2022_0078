import { NextResponse } from "next/server";
import { requireUser, requireRole } from "@/src/lib/auth_guard";
import { checkoutPreview } from "@/src/controllers/checkout_controller";

export async function GET() {
  const user = await requireUser();
  requireRole(user, ["UVOZNIK"]);

  const res = await checkoutPreview(user.id);
  return NextResponse.json(res.json, { status: res.status });
}