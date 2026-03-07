import { db } from "@/src/db";
import {
  faktura,
  saradnja,
  stavkaFakture,
  stavkaKontejnera,
  proizvod,
} from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
 
function mesecLabel(yyyyMm: string) {
  const [godinaStr, mesecStr] = yyyyMm.split("-");
  const godina = Number(godinaStr);
  const mesec = Number(mesecStr);
 
  const nazivi = [
    "Januar",
    "Februar",
    "Mart",
    "April",
    "Maj",
    "Jun",
    "Jul",
    "Avgust",
    "Septembar",
    "Oktobar",
    "Novembar",
    "Decembar",
  ];
 
  if (!godina || !mesec || mesec < 1 || mesec > 12) return yyyyMm;
  return `${nazivi[mesec - 1]} ${godina}`;
}
 
export async function getProdajaPoMesecima(dobavljacId: number) {
  try {
    const rows = await db
      .select({
        period: sql<string>`to_char(date_trunc('month', ${faktura.datumIzdavanja}), 'YYYY-MM')`.as("period"),
        ukupno: sql<number>`coalesce(sum(${stavkaKontejnera.iznosStavke}), 0)`.as("ukupno"),
      })
      .from(faktura)
      .innerJoin(saradnja, eq(faktura.idSaradnje, saradnja.idSaradnja))
      .innerJoin(stavkaFakture, eq(stavkaFakture.idFaktura, faktura.idFaktura))
      .innerJoin(
        stavkaKontejnera,
        eq(stavkaKontejnera.idKontejner, stavkaFakture.idKontejner)
      )
      .innerJoin(proizvod, eq(stavkaKontejnera.idProizvod, proizvod.id))
      .where(eq(saradnja.idDobavljac, dobavljacId))
      .groupBy(sql`date_trunc('month', ${faktura.datumIzdavanja})`)
      .orderBy(sql`date_trunc('month', ${faktura.datumIzdavanja})`);
 
    const data = rows.map((r) => ({
      period: r.period,
      mesec: mesecLabel(r.period),
      ukupno: Number(r.ukupno ?? 0),
    }));
 
    return {
      status: 200,
      json: {
        ok: true,
        items: data,
      },
    };
  } catch (err: any) {
    return {
      status: 500,
      json: {
        ok: false,
        error: err?.message ?? "Greška pri učitavanju prodaje po mesecima.",
      },
    };
  }
}
 
export async function getNajprodavanijiProizvodi(dobavljacId: number) {
  try {
    const rows = await db
      .select({
        idProizvod: proizvod.id,
        naziv: proizvod.naziv,
        ukupnaKolicina: sql<number>`coalesce(sum(${stavkaKontejnera.kolicina}), 0)`.as("ukupnaKolicina"),
      })
      .from(faktura)
      .innerJoin(saradnja, eq(faktura.idSaradnje, saradnja.idSaradnja))
      .innerJoin(stavkaFakture, eq(stavkaFakture.idFaktura, faktura.idFaktura))
      .innerJoin(
        stavkaKontejnera,
        eq(stavkaKontejnera.idKontejner, stavkaFakture.idKontejner)
      )
      .innerJoin(proizvod, eq(stavkaKontejnera.idProizvod, proizvod.id))
      .where(eq(saradnja.idDobavljac, dobavljacId))
      .groupBy(proizvod.id, proizvod.naziv)
      .orderBy(sql`coalesce(sum(${stavkaKontejnera.kolicina}), 0) desc`);
 
    const data = rows.map((r) => ({
      idProizvod: r.idProizvod,
      naziv: r.naziv,
      ukupnaKolicina: Number(r.ukupnaKolicina ?? 0),
    }));
 
    return {
      status: 200,
      json: {
        ok: true,
        items: data,
      },
    };
  } catch (err: any) {
    return {
      status: 500,
      json: {
        ok: false,
        error: err?.message ?? "Greška pri učitavanju najprodavanijih proizvoda.",
      },
    };
  }
}
 
export async function getPrihodPoProizvodima(dobavljacId: number) {
  try {
    const rows = await db
      .select({
        idProizvod: proizvod.id,
        naziv: proizvod.naziv,
        ukupno: sql<number>`coalesce(sum(${stavkaKontejnera.iznosStavke}), 0)`.as("ukupno"),
      })
      .from(faktura)
      .innerJoin(saradnja, eq(faktura.idSaradnje, saradnja.idSaradnja))
      .innerJoin(stavkaFakture, eq(stavkaFakture.idFaktura, faktura.idFaktura))
      .innerJoin(
        stavkaKontejnera,
        eq(stavkaKontejnera.idKontejner, stavkaFakture.idKontejner)
      )
      .innerJoin(proizvod, eq(stavkaKontejnera.idProizvod, proizvod.id))
      .where(eq(saradnja.idDobavljac, dobavljacId))
      .groupBy(proizvod.id, proizvod.naziv)
      .orderBy(sql`coalesce(sum(${stavkaKontejnera.iznosStavke}), 0) desc`);
 
    const data = rows.map((r) => ({
      idProizvod: r.idProizvod,
      naziv: r.naziv,
      ukupno: Number(r.ukupno ?? 0),
    }));
 
    return {
      status: 200,
      json: {
        ok: true,
        items: data,
      },
    };
  } catch (err: any) {
    return {
      status: 500,
      json: {
        ok: false,
        error: err?.message ?? "Greška pri učitavanju prihoda po proizvodima.",
      },
    };
  }
}