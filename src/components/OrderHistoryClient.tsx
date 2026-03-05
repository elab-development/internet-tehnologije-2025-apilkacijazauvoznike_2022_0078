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
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1>Istorija porudžbina</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 4 }}>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Partner</label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd", minWidth: 220 }}
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

      {faktureSorted.length === 0 ? (
        <div>Nema završenih porudžbina za izabrane filtere.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {faktureSorted.map((f) => {
            const isOpen = Boolean(expanded[f.idFaktura]);

            return (
              <div key={f.idFaktura} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div>
                      <b>Faktura #{f.idFaktura}</b> • saradnja #{f.idSaradnja}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      Partner: <b>{f.partner.ime}</b> (#{f.partner.id}) • Datum: <b>{formatDate(f.datumIzdavanja)}</b>
                    </div>
                  </div>

                  <div style={{ minWidth: 320, border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Roba</span>
                        <b>{Number(f.roba).toFixed(2)} €</b>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Kontejneri ({f.brojKontejnera}×)</span>
                        <b>{Number(f.kontejneriFee).toFixed(2)} €</b>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Carina</span>
                        <b>{Number(f.carina).toFixed(2)} €</b>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid #eee",
                          paddingTop: 6,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Ukupno</span>
                        <b>{Number(f.ukupno).toFixed(2)} €</b>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={() => toggle(f.idFaktura)}>{isOpen ? "Sakrij" : "Detalji"}</Button>
                      </div>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {f.kontejneri.map((k) => (
                      <div key={k.idKontejner} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <b>Kontejner #{k.idKontejner}</b> — status: <b>{k.status}</b>
                          </div>
                          <div>
                            Roba u kontejneru: <b>{Number(k.ukupnaCenaKontejnera || 0).toFixed(2)} €</b>
                          </div>
                        </div>

                        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                          {k.stavke.map((s) => (
                            <div key={s.rb} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <img
                                src={s.slika}
                                alt={s.naziv}
                                width={48}
                                height={48}
                                style={{ objectFit: "cover", borderRadius: 6 }}
                              />
                              <div style={{ flex: 1 }}>
                                <div>
                                  <b>{s.naziv}</b>
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.85 }}>
                                  Količina: <b>{s.kolicina}</b> • Cena: {Number(s.cena).toFixed(2)} €
                                </div>
                              </div>
                              <div>
                                <b>{Number(s.iznosStavke).toFixed(2)} €</b>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}