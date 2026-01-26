import { NextResponse } from "next/server";
import { updateSaradnja, deleteSaradnja } from "@/src/controllers/saradnja_controller";

export async function PATCH(req: Request, context:any) {
  const body = await req.json();

  const params=await context.params;
  const result = await updateSaradnja(params.id, body);
  return NextResponse.json(result.json, { status: result.status });
}

export async function DELETE(_: Request, context:any) {
  const params=await context.params;
  const result = await deleteSaradnja(params.id);
  return NextResponse.json(result.json, { status: result.status });
}
