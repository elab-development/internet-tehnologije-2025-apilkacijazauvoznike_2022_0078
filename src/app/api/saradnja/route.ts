import { NextResponse } from "next/server";
import { createSaradnja } from "@/src/controllers/saradnja_controller";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await createSaradnja(body);
  return NextResponse.json(result.json, { status: result.status });
}
