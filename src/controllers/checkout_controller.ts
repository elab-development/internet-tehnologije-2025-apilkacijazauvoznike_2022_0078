import { db } from "@/src/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  kontejner,
  stavkaKontejnera,
  proizvod,
  saradnja,
  korisnik,
  faktura,
  stavkaFakture,
} from "@/src/db/schema";

type KontejnerStatus = "OPEN" | "CLOSED" | "REOPEN" | "PAUSED" | "PAID";

const CHECKOUT_STATUSES: KontejnerStatus[] = ["OPEN", "CLOSED", "REOPEN", "PAUSED"];

const CENA_KONTEJNERA = 3200;
const CARINA_PROCENAT = 0.1;

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function checkoutPreview(uvoznikId: number) {
  try {
    const kRows = await db
      .select({
        idKontejner: kontejner.idKontejner,
        idSaradnja: kontejner.idSaradnja,
        status: kontejner.status,
        maxZapremina: kontejner.maxZapremina,
        trenutnaZapremina: kontejner.trenutnaZapremina,
        cenaKontejnera: kontejner.cenaKontejnera,
        ukupnaCenaKontejnera: kontejner.ukupnaCenaKontejnera,
      })
      .from(kontejner)
      .where(and(eq(kontejner.idUvoznik, uvoznikId), inArray(kontejner.status, CHECKOUT_STATUSES as any)));

    if (kRows.length === 0) {
      return { status: 200, json: { ok: true, groups: [], totals: { grandTotal: 0 } } };
    }

    const ids = kRows.map((k) => k.idKontejner);

    const itemRows = await db
      .select({
        idKontejner: stavkaKontejnera.idKontejner,
        rb: stavkaKontejnera.rb,
        idProizvod: stavkaKontejnera.idProizvod,
        kolicina: stavkaKontejnera.kolicina,
        iznosStavke: stavkaKontejnera.iznosStavke,

        naziv: proizvod.naziv,
        slika: proizvod.slika,
        cena: proizvod.cena,

        idDobavljac: proizvod.idDobavljac,
      })
      .from(stavkaKontejnera)
      .innerJoin(proizvod, eq(stavkaKontejnera.idProizvod, proizvod.id))
      .where(inArray(stavkaKontejnera.idKontejner, ids));

    const itemsByK = new Map<number, any[]>();
    for (const it of itemRows) {
      itemsByK.set(it.idKontejner, [...(itemsByK.get(it.idKontejner) ?? []), it]);
    }

    const kWithItems = kRows.filter((k) => (itemsByK.get(k.idKontejner)?.length ?? 0) > 0);

    if (kWithItems.length === 0) {
      return { status: 200, json: { ok: true, groups: [], totals: { grandTotal: 0 } } };
    }

    const saradnjaIds = [...new Set(kWithItems.map((k) => k.idSaradnja))];

    const saradnjaRows = await db
      .select({
        idSaradnja: saradnja.idSaradnja,
        idDobavljac: saradnja.idDobavljac,
        dobavljacIme: korisnik.imePrezime,
      })
      .from(saradnja)
      .innerJoin(korisnik, eq(saradnja.idDobavljac, korisnik.id))
      .where(inArray(saradnja.idSaradnja, saradnjaIds));

    const saradnjaMap = new Map<number, { idDobavljac: number; dobavljacIme: string }>();
    for (const s of saradnjaRows) {
      saradnjaMap.set(s.idSaradnja, { idDobavljac: s.idDobavljac, dobavljacIme: s.dobavljacIme });
    }

    const groupsMap = new Map<number, any>();

    for (const k of kWithItems) {
      const sInfo = saradnjaMap.get(k.idSaradnja);
      const key = k.idSaradnja;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          idSaradnja: key,
          idDobavljac: sInfo?.idDobavljac ?? null,
          dobavljacIme: sInfo?.dobavljacIme ?? "Nepoznat dobavljač",
          kontejneri: [],
          sumaKontejnera: 0,
        });
      }

      const g = groupsMap.get(key);
      const robaK = Number(k.ukupnaCenaKontejnera ?? 0);

      g.kontejneri.push({
        ...k,
        stavke: itemsByK.get(k.idKontejner) ?? [],
      });

      g.sumaKontejnera += robaK;
    }

    const groups = [...groupsMap.values()].sort((a, b) => (a.idSaradnja ?? 0) - (b.idSaradnja ?? 0));
    const grandTotalRoba = groups.reduce((acc, g) => acc + (Number(g.sumaKontejnera) || 0), 0);

    return {
      status: 200,
      json: {
        ok: true,
        groups,
        totals: { grandTotalRoba: round2(grandTotalRoba) },
      },
    };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}

export async function checkoutCommit(uvoznikId: number, body: any) {
  // opcioni filter plati samo jednog dobavljaca (saradnju)
  const onlySaradnjaIdRaw = body?.idSaradnja;
  const onlySaradnjaId =
    onlySaradnjaIdRaw === undefined || onlySaradnjaIdRaw === null
      ? undefined
      : Number(onlySaradnjaIdRaw);

  if (onlySaradnjaId !== undefined && (!Number.isInteger(onlySaradnjaId) || onlySaradnjaId <= 0)) {
    return { status: 400, json: { ok: false, error: "BAD_ID_SARADNJA", message: "Neispravan idSaradnja." } };
  }

  try {
    const kRows = await db
      .select({
        idKontejner: kontejner.idKontejner,
        idSaradnja: kontejner.idSaradnja,
        status: kontejner.status,
        ukupnaCenaKontejnera: kontejner.ukupnaCenaKontejnera,
      })
      .from(kontejner)
      .where(and(eq(kontejner.idUvoznik, uvoznikId), inArray(kontejner.status, CHECKOUT_STATUSES as any)));

    if (kRows.length === 0) {
      return { status: 400, json: { ok: false, error: "EMPTY_CART", message: "Korpa je prazna." } };
    }

    const ids = kRows.map((k) => k.idKontejner);

    const itemCountRows = await db
      .select({
        idKontejner: stavkaKontejnera.idKontejner,
        cnt: sql<number>`count(*)`.as("cnt"),
      })
      .from(stavkaKontejnera)
      .where(inArray(stavkaKontejnera.idKontejner, ids))
      .groupBy(stavkaKontejnera.idKontejner);

    const countMap = new Map<number, number>();
    for (const r of itemCountRows) countMap.set(r.idKontejner, Number(r.cnt));

    let kWithItems = kRows.filter((k) => (countMap.get(k.idKontejner) ?? 0) > 0);

    if (kWithItems.length === 0) {
      return { status: 400, json: { ok: false, error: "EMPTY_CART", message: "Korpa nema stavki." } };
    }

    // ako se placa samo 1 dobavljac filtriraj kontejnere
    if (onlySaradnjaId !== undefined) {
      kWithItems = kWithItems.filter((k) => k.idSaradnja === onlySaradnjaId);

      if (kWithItems.length === 0) {
        return {
          status: 400,
          json: { ok: false, error: "NOTHING_FOR_THIS_SUPPLIER", message: "Nema stavki za izabranog dobavljača." },
        };
      }
    }

    // ne dozvoli duplo fakturisanje istog kontejnera
    const already = await db
      .select({ idK: stavkaFakture.idKontejner })
      .from(stavkaFakture)
      .where(inArray(stavkaFakture.idKontejner, kWithItems.map((k) => k.idKontejner)));

    if (already.length > 0) {
      return {
        status: 409,
        json: {
          ok: false,
          error: "ALREADY_INVOICED",
          message: "Neki kontejneri su već fakturisani. Osvežite stranicu.",
        },
      };
    }

    // Grupisanje po saradnji 
    const groups = new Map<number, { kontejneri: typeof kWithItems }>();
    for (const k of kWithItems) {
      const g = groups.get(k.idSaradnja) ?? { kontejneri: [] as any };
      g.kontejneri.push(k as any);
      groups.set(k.idSaradnja, g);
    }

    const created = await db.transaction(async (tx: any) => {
      const results: any[] = [];

      for (const [idSaradnja, g] of groups.entries()) {
        const robaSum = g.kontejneri.reduce((acc, k) => acc + Number(k.ukupnaCenaKontejnera ?? 0), 0);

        const brojKontejnera = g.kontejneri.length;
        const kontejnerFee = brojKontejnera * CENA_KONTEJNERA;

        const carina = round2(robaSum * CARINA_PROCENAT);
        const ukupno = round2(robaSum + carina + kontejnerFee);

        const insertedF = await tx
          .insert(faktura)
          .values({
            idSaradnje: idSaradnja,
            troskoviCarine: carina,
            ukupniTroskoviUvoza: ukupno,
          })
          .returning();

        const f = insertedF[0];

        for (const k of g.kontejneri) {
          await tx.insert(stavkaFakture).values({
            idFaktura: f.idFaktura,
            idKontejner: k.idKontejner,
            kolicina: 1,
            iznosStavke: Number(k.ukupnaCenaKontejnera ?? 0),
          });
        }

        results.push({
          idFaktura: f.idFaktura,
          idSaradnja,
          roba: round2(robaSum),
          brojKontejnera,
          cenaKontejnera: CENA_KONTEJNERA,
          kontejneriFee: round2(kontejnerFee),
          carina,
          ukupno,
        });
      }

      // postavi PAID samo za kontejnere koji su obuhvaceni ovom uplatom
      await tx
        .update(kontejner)
        .set({ status: "PAID" })
        .where(inArray(kontejner.idKontejner, kWithItems.map((k) => k.idKontejner)));

      return results;
    });

    return {
      status: 200,
      json: {
        ok: true,
        message: `Kreirano ${created.length} faktura.`,
        fakture: created,
      },
    };
  } catch (err: any) {
    return { status: 500, json: { ok: false, error: err?.message ?? "Greška" } };
  }
}