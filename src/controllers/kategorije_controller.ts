import { db } from "@/src/db";
import { kategorija } from "@/src/db/schema";
import { eq } from "drizzle-orm";


export async function getAllCategories() {
  const data = await db.select().from(kategorija);
  return data;
}


export async function createCategory(input: { ime: string; opis?: string | null }) {
  const ime = input.ime?.trim();
  const opis = input.opis ?? null;

  if (!ime) {
    return { error: { code: "VALIDATION_ERROR", message: "Polje ime je obavezno!" }};
  }

  const inserted = await db.insert(kategorija).values({ ime, opis }).returning();

  return { data: inserted[0] };
}

export async function deleteCategoryById(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    return { error: { code: "VALIDATION_ERROR", message: "ID mora biti pozitivan broj!" }};
  }

  const deleted = await db.delete(kategorija).where(eq(kategorija.id, id)).returning();

  if (deleted.length === 0) {
    return { error: { code: "NOT_FOUND", message: "Kategorija nije pronadjena!" }};
  }

  return { data: deleted[0] };
}

export async function updateCategory(id: number, input: { ime?: string; opis?: string | null }) {
  if (!Number.isInteger(id) || id <= 0) {
    return { error: { code: "VALIDATION_ERROR", message: "ID mora biti pozitivan broj!" } };
  }

  
  const ime = input.ime?.trim();
  const opis = input.opis;

  if (ime === undefined && opis === undefined) {
    return { 
      error: { code: "VALIDATION_ERROR", message: "Morate poslati bar jedno polje (ime ili opis)!" } 
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

  // Uporedjujemo podatke kategorije iz baze sa unetim podacima
  const finalIme = ime !== undefined ? ime : kategorijaBaza.ime;
  const finalOpis = opis !== undefined ? opis : kategorijaBaza.opis;

  if (finalIme === kategorijaBaza.ime && finalOpis === kategorijaBaza.opis) {
    return { 
      error: { 
        code: "NO_CHANGES", 
        message: "Nema razlike između poslatih i postojećih podataka!" 
      } 
    };
  }

  const updated = await db
    .update(kategorija)
    .set({ 
      ime: finalIme, 
      opis: finalOpis 
    })
    .where(eq(kategorija.id, id))
    .returning();

  return { data: updated[0] };
}