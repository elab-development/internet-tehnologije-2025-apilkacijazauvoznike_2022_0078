import { db } from "@/src/db";
import { proizvod, kategorija } from "@/src/db/schema";
import { and, eq } from "drizzle-orm";

type DobavljacProizvodiFilter = {
  kategorijaId?: number;
};

function isPosInt(n: any) {
  return Number.isInteger(n) && n > 0;
}

export async function getMojiProizvodiDobavljaca(
  idDobavljac: number,
  filter: DobavljacProizvodiFilter = {}
) {
  try {
    const conditions: any[] = [eq(proizvod.idDobavljac, idDobavljac)];

    if (filter.kategorijaId && isPosInt(filter.kategorijaId)) {
      conditions.push(eq(proizvod.idKategorija, filter.kategorijaId));
    }

    const rows = await db
      .select({
        id: proizvod.id,
        sifra: proizvod.sifra,
        naziv: proizvod.naziv,
        slika: proizvod.slika,
        sirina: proizvod.sirina,
        visina: proizvod.visina,
        duzina: proizvod.duzina,
        cena: proizvod.cena,

        idKategorija: proizvod.idKategorija,
        kategorijaIme: kategorija.ime,

        idDobavljac: proizvod.idDobavljac,
      })
      .from(proizvod)
      .leftJoin(kategorija, eq(proizvod.idKategorija, kategorija.id))
      .where(and(...conditions));

    return { status: 200, json: { ok: true, proizvodi: rows } };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}