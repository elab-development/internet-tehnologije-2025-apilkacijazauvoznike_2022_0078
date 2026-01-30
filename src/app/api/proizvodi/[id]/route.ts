import { NextResponse } from "next/server";
import { updateProizvod, deleteProizvod } from "@/src/controllers/proizvod_controller";
import { requireRole, requireUser } from "@/src/lib/auth_guard";

export async function PATCH(req: Request, context:any) {
  try {
    const user = await requireUser();
    requireRole(user, ["DOBAVLJAC"]);

    const body = await req.json();
    const id = context.params.id; //await

    const result = await updateProizvod(user.id, id, body);
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }}

export async function DELETE(_:Request,  context:any) {
 try {
    const user = await requireUser();
    requireRole(user, ["DOBAVLJAC"]);

    const id = context.params.id; //await

    const result = await deleteProizvod(user.id, id);
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }}
