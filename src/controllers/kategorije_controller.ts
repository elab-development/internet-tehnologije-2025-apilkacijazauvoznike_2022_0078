import { db } from "@/src/db";
import { kategorija } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { sanitizeText, sanitizeOptionalText } from "@/src/lib/sanitize";

export async function getAllCategories() {
  const data = await db.select().from(kategorija);
  return data;
}

export async function createCategory(input: { ime: string; opis?: string | null }) {
  const imeRaw = input.ime?.trim();
  const opisRaw = input.opis?.trim() ?? null;

  if (!imeRaw) {
    return { error: { code: "VALIDATION_ERROR", message: "Polje ime je obavezno!" } };
  }

  const ime = sanitizeText(imeRaw);
  const opis = opisRaw === null ? null : sanitizeText(opisRaw);

  const inserted = await db.insert(kategorija).values({ ime, opis }).returning();

  return { data: inserted[0] };
}

export async function deleteCategoryById(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    return { error: { code: "VALIDATION_ERROR", message: "ID mora biti pozitivan broj!" } };
  }

  const deleted = await db.delete(kategorija).where(eq(kategorija.id, id)).returning();

  if (deleted.length === 0) {
    return { error: { code: "NOT_FOUND", message: "Kategorija nije pronađena!" } };
  }

  return { data: deleted[0] };
}

export async function updateCategory(id: number, input: { ime?: string; opis?: string | null }) {
  if (!Number.isInteger(id) || id <= 0) {
    return { error: { code: "VALIDATION_ERROR", message: "ID mora biti pozitivan broj!" } };
  }

  const imeRaw = input.ime?.trim();
  const opisRaw = input.opis !== undefined
    ? input.opis === null
      ? null
      : input.opis.trim()
    : undefined;

  if (imeRaw === undefined && opisRaw === undefined) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "Morate poslati bar jedno polje (ime ili opis)!",
      },
    };
  }

  const existing = await db
    .select()
    .from(kategorija)
    .where(eq(kategorija.id, id))
    .limit(1);

  if (existing.length === 0) {
    return { error: { code: "NOT_FOUND", message: "Kategorija nije pronađena!" } };
  }

  const kategorijaBaza = existing[0];

  const sanitizedIme =
    imeRaw !== undefined ? sanitizeText(imeRaw) : undefined;

  const sanitizedOpis =
    opisRaw !== undefined
      ? opisRaw === null
        ? null
        : sanitizeText(opisRaw)
      : undefined;

  const finalIme = sanitizedIme !== undefined ? sanitizedIme : kategorijaBaza.ime;
  const finalOpis = sanitizedOpis !== undefined ? sanitizedOpis : kategorijaBaza.opis;

  if (finalIme === kategorijaBaza.ime && finalOpis === kategorijaBaza.opis) {
    return {
      error: {
        code: "NO_CHANGES",
        message: "Nema razlike između poslatih i postojećih podataka!",
      },
    };
  }

  const updated = await db
    .update(kategorija)
    .set({
      ime: finalIme,
      opis: finalOpis,
    })
    .where(eq(kategorija.id, id))
    .returning();

  return { data: updated[0] };
}