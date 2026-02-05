import { db } from "@/src/db";
import { korisnik, saradnja } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";

function validateCreateSaradnja(body: any) {
  const { idUvoznik, idDobavljac } = body ?? {};
  const nUvoznik = Number(idUvoznik);
  const nDobavljac = Number(idDobavljac);

  if (!Number.isInteger(nUvoznik) || nUvoznik <= 0) {
    return { ok: false as const, error: "idUvoznik je obavezan i mora biti pozitivan ceo broj" };
  }
  if (!Number.isInteger(nDobavljac) || nDobavljac <= 0) {
    return { ok: false as const, error: "idDobavljac je obavezan i mora biti pozitivan ceo broj" };
  }
  return { ok: true as const, data: { idUvoznik: nUvoznik, idDobavljac: nDobavljac } };
}

function parseId(id: string) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}


export async function createSaradnja(body: any) {
  const validated = validateCreateSaradnja(body);
  if (!validated.ok) {
    return { status: 400, json: { ok: false, error: validated.error } };
  }

  const { idUvoznik, idDobavljac } = validated.data;

  try {
    const existingRows = await db
      .select()
      .from(saradnja)
      .where(and(eq(saradnja.idUvoznik, idUvoznik), eq(saradnja.idDobavljac, idDobavljac)))
      .limit(1);

    const existing = existingRows[0];

    if (existing) {
      if (existing.pending === true) {
        return { status: 409, json: { ok: false, error: "REQUEST_ALREADY_SENT" } };
      }
      if (existing.pending === false && existing.status === true) {
        return { status: 409, json: { ok: false, error: "ALREADY_ACTIVE" } };
      }

      const updated = await db
        .update(saradnja)
        .set({ pending: true, status: false })
        .where(eq(saradnja.idSaradnja, existing.idSaradnja))
        .returning();

      return { status: 200, json: { ok: true, saradnja: updated[0] } };
    }

    const inserted = await db
      .insert(saradnja)
      .values({
        idUvoznik,
        idDobavljac,
        pending: true,
        status: false,
      })
      .returning();

    return { status: 201, json: { ok: true, saradnja: inserted[0] } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}


export async function updateSaradnja(idParam: string, body: any) {
  const id = parseId(idParam);
  if (!id) return { status: 400, json: { ok: false, error: "Neispravan ID saradnje!" } };

  const patch: any = {};

  if (body?.status !== undefined) {
    if (typeof body.status !== "boolean") {
      return { status: 400, json: { ok: false, error: "Status mora biti boolean" } };
    }
    patch.status = body.status;
  }

  if (body?.pending !== undefined) {
    if (typeof body.pending !== "boolean") {
      return { status: 400, json: { ok: false, error: "Pending mora biti boolean" } };
    }
    patch.pending = body.pending;
  }

  if (Object.keys(patch).length === 0) {
    return { status: 400, json: { ok: false, error: "Nema polja za izmenu" } };
  }

  try {
    const updated = await db
      .update(saradnja)
      .set(patch)
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
    return {
      status: 409,
      json: {
        ok: false,
        error:
          "Nije moguce obrisati saradnju zbog postojece fakture! Umesto toga uradite -> pending=false,status=false (prekid saradnje).",
      },
    };
  }
}

export async function getAllSaradnje(filter?: { idUvoznik?: number; idDobavljac?: number }) {
  try {
    const uvoznikK = aliasedTable(korisnik,"uvoznikK");
    const dobavljacK = aliasedTable(korisnik,"dobavljacK");

    let q = db
      .select({
        idSaradnja: saradnja.idSaradnja,
        idUvoznik: saradnja.idUvoznik,
        idDobavljac: saradnja.idDobavljac,
        datumPocetka: saradnja.datumPocetka,
        status: saradnja.status,
        pending: saradnja.pending,

        uvoznikIme: uvoznikK.imePrezime,
        uvoznikEmail: uvoznikK.email,

        dobavljacIme: dobavljacK.imePrezime,
        dobavljacEmail: dobavljacK.email,
      })
      .from(saradnja)
      .leftJoin(uvoznikK, eq(saradnja.idUvoznik, uvoznikK.id))
      .leftJoin(dobavljacK, eq(saradnja.idDobavljac, dobavljacK.id));

    if (filter?.idUvoznik) {
      q = q.where(eq(saradnja.idUvoznik, filter.idUvoznik)) as any;
    } else if (filter?.idDobavljac) {
      q = q.where(eq(saradnja.idDobavljac, filter.idDobavljac)) as any;
    }

    const rows = await q;
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