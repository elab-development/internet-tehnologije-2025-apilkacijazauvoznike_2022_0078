import { db } from "@/src/db";
import { saradnja } from "@/src/db/schema";
import { eq } from "drizzle-orm";

function validateCreateSaradnja(body: any) {
  const { idUvoznik, idDobavljac } = body ?? {};
  const nUvoznik = Number(idUvoznik);
  const nDobavljac = Number(idDobavljac);

  if (!Number.isInteger(nUvoznik) || nUvoznik <= 0) return { ok: false as const, error: "idUvoznik je obavezan i mora biti pozitivan ceo broj" };
  if (!Number.isInteger(nDobavljac) || nDobavljac <= 0) return { ok: false as const, error: "idDobavljac je obavezan i mora biti pozitivan ceo broj" };
  return { ok: true as const, data: { idUvoznik: nUvoznik, idDobavljac: nDobavljac } };
}

export async function createSaradnja(body: any) {
  const validated = validateCreateSaradnja(body);
  if (!validated.ok) {
    return { status: 400, json: { ok: false, error: validated.error } };
  }

  try {
    const inserted = await db
      .insert(saradnja)
      .values({
        ...validated.data,
        status: true,
      })
      .returning();

    return { status: 201, json: { ok: true, saradnja: inserted[0] } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

function parseId(id: string) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export async function updateSaradnja(idParam: string, body: any) {
  const id = parseId(idParam);
  if (!id) return { status: 400, json: { ok: false, error: "Neispravsn ID saradnje!" } };

  if (typeof body?.status !== "boolean") {
    return { status: 400, json: { ok: false, error: "Status mora biti boolean" } };
  }

  try {
    const updated = await db
      .update(saradnja)
      .set({ status: body.status })
      .where(eq(saradnja.idSaradnja, id))
      .returning();

    if (updated.length === 0) {
      return { status: 404, json: { ok: false, error: "Saradnja nije pronađena" } };
    }

    return { status: 200, json: { ok: true, saradnja: updated[0] } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function deleteSaradnja(idParam: string) {
  const id = parseId(idParam);
  if (!id) return { status: 400, json: { ok: false, error: "Neispravan ID saradnje" } };

  try {
    const deleted = await db
      .delete(saradnja)
      .where(eq(saradnja.idSaradnja, id))
      .returning();

    if (deleted.length === 0) {
      return { status: 404, json: { ok: false, error: "Saradnja nije pronađena" } };
    }

    return { status: 200, json: { ok: true, deleted: deleted[0] } };
  } catch (err: any) {
    // restrict
    return {
      status: 409,
      json: {
        ok: false,
        error:
          "Nije moguce obrisati saradnju zbog postojece fakture! Umesto toga uradite -> status=false (prekid saradnje).",
      },
    };
  }
}

export async function getAllSaradnje(filter?: { idUvoznik?: number; idDobavljac?: number }) {
  try {
    // uvoznik
    if (filter?.idUvoznik) {
      const rows = await db
        .select()
        .from(saradnja)
        .where(eq(saradnja.idUvoznik, filter.idUvoznik));
      return { status: 200, json: { ok: true, saradnje: rows } };
    }

    // dobavljac
    if (filter?.idDobavljac) {
      const rows = await db
        .select()
        .from(saradnja)
        .where(eq(saradnja.idDobavljac, filter.idDobavljac));
      return { status: 200, json: { ok: true, saradnje: rows } };
    }

    //admin 
    const rows = await db.select().from(saradnja);
    return { status: 200, json: { ok: true, saradnje: rows } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function getSaradnjaById(idParam: string) {
  const id = parseId(idParam);
  if (!id) return { status: 400, json: { ok: false, error: "Neispravan ID saradnje" } };

  try {
    const rows = await db
      .select()
      .from(saradnja)
      .where(eq(saradnja.idSaradnja, id))
      .limit(1);

    const s = rows[0];
    if (!s) return { status: 404, json: { ok: false, error: "Saradnja nije pronađena" } };

    return { status: 200, json: { ok: true, saradnja: s } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

