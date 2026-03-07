"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";

type PreviewItem = {
  idKontejner: number;
  rb: number;
  idProizvod: number;
  kolicina: number;
  iznosStavke: number;
  naziv: string;
  slika: string;
  cena: number;
  idDobavljac: number;
};

type PreviewKontejner = {
  idKontejner: number;
  idSaradnja: number;
  status: "OPEN" | "CLOSED" | "REOPEN" | "PAUSED" | "PAID";
  maxZapremina: number;
  trenutnaZapremina: number | null;
  cenaKontejnera: number;
  ukupnaCenaKontejnera: number | null;
  stavke: PreviewItem[];
};

type Group = {
  idSaradnja: number;
  idDobavljac: number | null;
  dobavljacIme: string;
  kontejneri: PreviewKontejner[];
  sumaKontejnera: number; 
};

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await res.json().catch(() => ({}));
  }
  const text = await res.text().catch(() => "");
  return {
    ok: false,
    error: "NON_JSON_RESPONSE",
    message: text?.slice(0, 160) || "Server vratio non-JSON odgovor",
  };
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const CENA_KONTEJNERA = 3200;
const CARINA_PROCENAT = 0.1;

export default function CheckoutPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [expandedBySaradnja, setExpandedBySaradnja] = useState<Record<number, boolean>>({});

  const [busyPayBySaradnja, setBusyPayBySaradnja] = useState<Record<number, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/uvoznik/checkout/preview", {
        cache: "no-store",
        credentials: "include",
      });

      const json: any = await safeJson(res);

      if (!res.ok || !json?.ok) {
        setError(json?.message ?? json?.error ?? "Greška pri učitavanju pregleda.");
        setLoading(false);
        return;
      }

      const nextGroups: Group[] = json.groups ?? [];
      setGroups(nextGroups);

      const initExpanded: Record<number, boolean> = {};
      for (const g of nextGroups) initExpanded[g.idSaradnja] = false;
      setExpandedBySaradnja(initExpanded);

      setLoading(false);
    } catch {
      setError("Greška pri učitavanju.");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const computedByGroup = useMemo(() => {
    return groups.map((g) => {
      const roba = Number(g.sumaKontejnera || 0);
      const brojKontejnera = g.kontejneri.length;
      const kontejneriFee = brojKontejnera * CENA_KONTEJNERA;
      const carina = round2(roba * CARINA_PROCENAT);
      const ukupno = round2(roba + carina + kontejneriFee);

      return {
        ...g,
        roba: round2(roba),
        brojKontejnera,
        kontejneriFee: round2(kontejneriFee),
        carina,
        ukupno,
      };
    });
  }, [groups]);

  const grandTotal = useMemo(() => {
    return round2(computedByGroup.reduce((acc, g) => acc + g.ukupno, 0));
  }, [computedByGroup]);

  function toggleExpanded(idSaradnja: number) {
    setExpandedBySaradnja((prev) => ({ ...prev, [idSaradnja]: !prev[idSaradnja] }));
  }

  async function payOne(idSaradnja: number, dobavljacIme: string) {
    if (groups.length === 0) {
      alert("Nema ničega za plaćanje.");
      return;
    }

    const ok = confirm(
      `Plati samo za dobavljača "${dobavljacIme}" (saradnja #${idSaradnja})?\n\nOvo će kreirati JEDNU fakturu i označiti samo njegove kontejnere kao PAID.`
    );
    if (!ok) return;

    try {
      setBusyPayBySaradnja((prev) => ({ ...prev, [idSaradnja]: true }));

      const res = await fetch("/api/uvoznik/checkout/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idSaradnja }), 
      });

      const json: any = await safeJson(res);

      if (!res.ok || !json?.ok) {
        alert(json?.message ?? json?.error ?? "Greška pri plaćanju.");
        return;
      }

      alert(json?.message ?? "Plaćeno.");
      // placcen jedan dobavljac i njegovi kontejneri nestaju iz pregleda jer su PAID
      await load();
    } finally {
      setBusyPayBySaradnja((prev) => ({ ...prev, [idSaradnja]: false }));
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Učitavanje pregleda...</div>;
  if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1>Pregled porudžbine</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={() => router.push("/uvoznik/kontejner")}>Nazad u korpu</Button>
          <Button onClick={load}>Osveži</Button>
        </div>
      </div>

      {computedByGroup.length === 0 ? (
        <div>Korpa je prazna.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {computedByGroup.map((g) => {
            const expanded = Boolean(expandedBySaradnja[g.idSaradnja]);
            const busy = Boolean(busyPayBySaradnja[g.idSaradnja]);

            return (
              <div key={g.idSaradnja} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div>
                      <b>Dobavljač:</b> {g.dobavljacIme}{" "}
                      <span style={{ fontSize: 12, opacity: 0.7 }}>(saradnja #{g.idSaradnja})</span>
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      Kontejnera: <b>{g.brojKontejnera}</b> • Roba ukupno: <b>{g.roba.toFixed(2)} €</b>
                    </div>
                  </div>

                  {/* Checkout breakdown */}
                  <div style={{ minWidth: 300, border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>Roba</span>
                        <b>{g.roba.toFixed(2)} €</b>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>
                          Kontejneri ({g.brojKontejnera} × {CENA_KONTEJNERA} €)
                        </span>
                        <b>{g.kontejneriFee.toFixed(2)} €</b>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>Carina (10% od robe)</span>
                        <b>{g.carina.toFixed(2)} €</b>
                      </div>

                      <div
                        style={{
                          borderTop: "1px solid #eee",
                          paddingTop: 6,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>Ukupno za dobavljača</span>
                        <b>{g.ukupno.toFixed(2)} €</b>
                      </div>

                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6, flexWrap: "wrap" }}>
                        <Button onClick={() => toggleExpanded(g.idSaradnja)}>
                          {expanded ? "Sakrij kontejnere" : "Prikaži kontejnere"}
                        </Button>

                        <Button onClick={() => payOne(g.idSaradnja, g.dobavljacIme)} disabled={busy}>
                          {busy ? "Plaćanje..." : "Plati ovog dobavljača"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✅ Kontejneri i stavke su skupljeni dok korisnik ne klikne */}
                {expanded && (
                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {g.kontejneri.map((k) => (
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

          {/* Samo prikaz total-a, bez globalnog plaćanja */}
          <div
            style={{
              borderTop: "1px solid #eee",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 16 }}>
              Grand total (sve grupe): <b>{grandTotal.toFixed(2)} €</b>
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Plaćanje se radi po dobavljaču (svaka faktura posebno).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}