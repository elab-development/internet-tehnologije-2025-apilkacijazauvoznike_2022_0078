import { NextResponse } from "next/server";
import { deleteCategoryById, updateCategory } from "@/src/controllers/kategorije_controller";
import { requireRole, requireUser } from "@/src/lib/auth_guard";


export async function DELETE(req: Request, context: any) {
  try {
    const user = await requireUser();
    requireRole(user, ["ADMIN"]);

    const params = await context.params;
    const id = Number(params.id);

    const result = await deleteCategoryById(id);

    if (result.error) {
      const statusCode = result.error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json(
        { ok: false, error: result.error.code, message: result.error.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (e:any) {
    if(e instanceof Response) return e;
    
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri brisanju kategorije!" },
      { status: 500 }
    );
  }
}


export async function PATCH(req: Request, context: any) {
  try {
    const user = await requireUser();
    requireRole(user, ["ADMIN"]);

    const params = await context.params;
    const id = Number(params.id);
    const body = await req.json();

    const result = await updateCategory(id, {
      ime: body.ime,
      opis: body.opis,
    });

    if (result.error) {
      let status = 400;
      if (result.error.code === "NOT_FOUND") status = 404;
      if (result.error.code === "NO_CHANGES") status = 409; 

      return NextResponse.json({ ok: false, ...result.error }, { status });
    }

    return NextResponse.json({ ok: true, data: result.data });
  } catch (e: any) {
    if(e instanceof Response) return e;

    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", message: "Greska pri izmeni podataka!" },
      { status: 500 }
    );
  }
}

