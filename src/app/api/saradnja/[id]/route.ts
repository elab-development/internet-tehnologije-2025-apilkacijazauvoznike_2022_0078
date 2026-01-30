import { NextResponse } from "next/server";
import { updateSaradnja, deleteSaradnja, getSaradnjaById } from "@/src/controllers/saradnja_controller";
import { requireUser } from "@/src/lib/auth_guard";

export async function PATCH(req: Request, context: any) {
  try {

    const user = await requireUser();
    const params= await context.params;
    const id = params.id;
    const body = await req.json();
    const sDb = await getSaradnjaById(id);

    if (!sDb.json?.ok) {
      return NextResponse.json(sDb.json, { status: sDb.status });
    }

    const s = sDb.json.saradnja;
    if (!s) {
      return NextResponse.json(
        { ok: false, error: "NOT_FOUND", message: "Saradnja nije pronađena" },
        { status: 404 }
      );
    }

    //uvoznik i dobavljac samo ako se poklapa user i baza
    const isOwner =
      user.uloga === "ADMIN" ||
      (user.uloga === "UVOZNIK" && s.idUvoznik === user.id) ||
      (user.uloga === "DOBAVLJAC" && s.idDobavljac === user.id);

    if (!isOwner) {
      return NextResponse.json(
        { ok: false, error: "FORBIDDEN", message: "Nemate pravo da menjate ovu saradnju" },
        { status: 403 }
      );
    }

    const result = await updateSaradnja(id, body);
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, context:any) {
  try {
    const user = await requireUser();
    if (user.uloga !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "FORBIDDEN", message: "Samo admin može brisati saradnju" }, { status: 403 });
    }

    const params=await context.params;
    const id = params.id;
    const result = await deleteSaradnja(id);
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
