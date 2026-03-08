"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/src/components/Button";

type Stavka = {
  rb: number;
  idProizvod: number;
  kolicina: number;
  iznosStavke: number;
  naziv: string;
  slika: string;
  cena: number;
  idDobavljac: number;
};

type Kontejner = {
  idKontejner: number;
  status: "OPEN" | "CLOSED" | "REOPEN" | "PAUSED" | "PAID";
  ukupnaCenaKontejnera: number;
  stavke: Stavka[];
};

type Faktura = {
  idFaktura: number;
  datumIzdavanja: string | null;
  idSaradnja: number;

  partner: { id: number; ime: string };

  roba: number;
  brojKontejnera: number;
  kontejneriFee: number;
  carina: number;
  ukupno: number;

  kontejneri: Kontejner[];
};

type ApiResp = {
  ok: boolean;
  fakture?: Faktura[];
  error?: string;
  message?: string;
};

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store", credentials: "include" });

  // Ocekujemo JSON ako nije tretiramo kao gresku
  let json: any = {};
  try {
    json = await res.json();
  } catch {
    json = { ok: false, error: "BAD_RESPONSE", message: "Server nije vratio JSON." };
  }

  return { res, json };
}

function formatDate(d: string | null) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
}

function dateToMs(d: string | null) {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export default function OrderHistoryClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fakture, setFakture] = useState<Faktura[]>([]);

  // Filter partner ("" = svi)
  const [partnerId, setPartnerId] = useState<string>("");

  // Sort datum 
  const [sortDir, setSortDir] = useState<"DESC" | "ASC">("DESC");

  // Expand/collapse fakture
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Ucitaj fakture 
  async function loadHistory(nextPartnerId?: string) {
    setLoading(true);
    setError(null);

    const p = nextPartnerId ?? partnerId;

    const params = new URLSearchParams();
    if (p) params.set("partnerId", p);

    const url = `/api/istorija?${params.toString()}`;

    try {
      const { res, json } = await fetchJson(url);

      const data: ApiResp = json;

      if (!res.ok || !data.ok) {
        setError(data.message ?? data.error ?? "Greška pri učitavanju istorije.");
        setLoading(false);
        return;
      }

      const list = data.fakture ?? [];
      setFakture(list);

      // default collapse sve
      const init: Record<number, boolean> = {};
      for (const f of list) init[f.idFaktura] = false;
      setExpanded(init);

      setLoading(false);
    } catch {
      setError("Greška pri učitavanju.");
      setLoading(false);
    }
  }

  // ucitaj prvi put
  useEffect(() => {
    loadHistory();
  }, []);

  // Partners dropdown opcije 
  const partners = useMemo(() => {
    const arr: { id: number; ime: string }[] = [];

    for (const f of fakture) {
      const already = arr.find((x) => x.id === f.partner.id);
      if (!already) {
        arr.push({ id: f.partner.id, ime: f.partner.ime });
      }
    }

    arr.sort((a, b) => a.ime.localeCompare(b.ime));
    return arr;
  }, [fakture]);

  // 3) Sort prikaz 
  const faktureSorted = useMemo(() => {
    const copy = [...fakture];

    copy.sort((a, b) => {
      const ta = dateToMs(a.datumIzdavanja);
      const tb = dateToMs(b.datumIzdavanja);

      if (sortDir === "DESC") {
        // najnovije prvo
        if (tb !== ta) return tb - ta;
        return b.idFaktura - a.idFaktura;
      } else {
        // najstarije prvo
        if (ta !== tb) return ta - tb;
        return a.idFaktura - b.idFaktura;
      }
    });

    return copy;
  }, [fakture, sortDir]);

  function toggle(idFaktura: number) {
    setExpanded((prev) => ({ ...prev, [idFaktura]: !prev[idFaktura] }));
  }

  function applyFilters() {
    loadHistory(partnerId);
  }

  function clearFilters() {
    setPartnerId("");
    loadHistory("");
  }

  function toggleSort() {
    setSortDir((prev) => (prev === "DESC" ? "ASC" : "DESC"));
  }

  if (loading) return <div style={{ padding: 16 }}>Učitavanje istorije...</div>;
  if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Uvoznik / Istorija
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Istorija porudžbina
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Pregled završenih porudžbina sa filtriranjem po partneru i smeru sortiranja.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Partner
              </label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">Svi</option>
                {partners.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.ime} (#{p.id})
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={applyFilters}>Primeni</Button>
            <Button onClick={clearFilters}>Reset</Button>

            <Button onClick={toggleSort}>
              {sortDir === "DESC" ? "Najnovije → Najstarije" : "Najstarije → Najnovije"}
            </Button>
          </div>
        </div>
      </section>

      {faktureSorted.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">
            Nema završenih porudžbina
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Nema rezultata za izabrane filtere.
          </p>
        </section>
      ) : (
        <div className="grid gap-5">
          {faktureSorted.map((f) => {
            const isOpen = Boolean(expanded[f.idFaktura]);

            return (
              <section
                key={f.idFaktura}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="grid gap-2">
                    <div className="text-lg font-semibold text-slate-900">
                      Faktura #{f.idFaktura}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        • saradnja #{f.idSaradnja}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      Partner: <b>{f.partner.ime}</b> (#{f.partner.id}) • Datum:{" "}
                      <b>{formatDate(f.datumIzdavanja)}</b>
                    </div>
                  </div>

                  <div className="min-w-[320px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 text-sm text-slate-700">
                      <div className="flex justify-between gap-3">
                        <span>Roba</span>
                        <b>{Number(f.roba).toFixed(2)} €</b>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>Kontejneri ({f.brojKontejnera}×)</span>
                        <b>{Number(f.kontejneriFee).toFixed(2)} €</b>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>Carina</span>
                        <b>{Number(f.carina).toFixed(2)} €</b>
                      </div>

                      <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
                        <span className="font-medium">Ukupno</span>
                        <b>{Number(f.ukupno).toFixed(2)} €</b>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={() => toggle(f.idFaktura)}>
                          {isOpen ? "Sakrij" : "Detalji"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 grid gap-3">
                    {f.kontejneri.map((k) => (
                      <article
                        key={k.idKontejner}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="text-sm text-slate-700">
                            <b>Kontejner #{k.idKontejner}</b> — status: <b>{k.status}</b>
                          </div>
                          <div className="text-sm text-slate-700">
                            Roba u kontejneru:{" "}
                            <b>{Number(k.ukupnaCenaKontejnera || 0).toFixed(2)} €</b>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3">
                          {k.stavke.map((s) => (
                            <div
                              key={s.rb}
                              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                            >
                              <img
                                src={s.slika}
                                alt={s.naziv}
                                width={48}
                                height={48}
                                style={{ objectFit: "cover", borderRadius: 8 }}
                              />
                              <div className="min-w-[220px] flex-1">
                                <div className="font-semibold text-slate-900">{s.naziv}</div>
                                <div className="text-sm text-slate-600">
                                  Količina: <b>{s.kolicina}</b> • Cena: {Number(s.cena).toFixed(2)} €
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-slate-900">
                                {Number(s.iznosStavke).toFixed(2)} €
                              </div>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}