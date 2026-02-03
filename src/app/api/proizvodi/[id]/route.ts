import { NextResponse } from "next/server";
import { updateProizvod, deleteProizvod, getProizvodById } from "@/src/controllers/proizvod_controller";
import { requireRole, requireUser } from "@/src/lib/auth_guard";

export async function PATCH(req: Request, context: any) {
  try {
    const user = await requireUser();
    requireRole(user, ["DOBAVLJAC"]);

    const body = await req.json();

    const params = await context.params;
    const id = params.id;

    const result = await updateProizvod(user.id, id, body);
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: any) {
  try {
    const user = await requireUser();
    requireRole(user, ["DOBAVLJAC"]);

    const params = await context.params;
    const id = params.id;

    const result = await deleteProizvod(user.id, id);
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function GET(_: Request, {params}:{params:Promise<{id:string}>}) {
  try {
    const user = await requireUser();
    requireRole(user, ["DOBAVLJAC"]);

    const paramsResolved = await params;
    const id = parseInt(paramsResolved.id,10);
    if (isNaN(id)) {
      return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
    }

    const result = await getProizvodById(user.id, id);
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}