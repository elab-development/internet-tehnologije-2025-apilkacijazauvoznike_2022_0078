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
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Uvoznik / Checkout
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Pregled porudžbine
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Završni pregled porudžbine po dobavljačima, kontejnerima i stavkama,
              sa obračunom troškova robe, kontejnera i carine.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/uvoznik/kontejner")}>
              Nazad u korpu
            </Button>
            <Button onClick={load}>Osveži</Button>
          </div>
        </div>
      </section>

      {computedByGroup.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Korpa je prazna</h3>
          <p className="mt-2 text-sm text-slate-600">
            Nema stavki za pregled porudžbine.
          </p>
        </section>
      ) : (
        <div className="grid gap-5">
          {computedByGroup.map((g) => {
            const expanded = Boolean(expandedBySaradnja[g.idSaradnja]);
            const busy = Boolean(busyPayBySaradnja[g.idSaradnja]);

            return (
              <section
                key={g.idSaradnja}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-slate-900">
                      Dobavljač: {g.dobavljacIme}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        (saradnja #{g.idSaradnja})
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      Kontejnera: <span className="font-semibold">{g.brojKontejnera}</span> •
                      Roba ukupno: <span className="font-semibold"> {g.roba.toFixed(2)} €</span>
                    </div>
                  </div>

                  <div className="min-w-[300px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-3 text-sm text-slate-700">
                      <div className="flex justify-between gap-3">
                        <span>Roba</span>
                        <b>{g.roba.toFixed(2)} €</b>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>
                          Kontejneri ({g.brojKontejnera} × {CENA_KONTEJNERA} €)
                        </span>
                        <b>{g.kontejneriFee.toFixed(2)} €</b>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span>Carina (10% od robe)</span>
                        <b>{g.carina.toFixed(2)} €</b>
                      </div>

                      <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
                        <span className="font-medium">Ukupno za dobavljača</span>
                        <b>{g.ukupno.toFixed(2)} €</b>
                      </div>

                      <div className="mt-2 flex flex-wrap justify-end gap-2">
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

                {expanded && (
                  <div className="mt-4 grid gap-3">
                    {g.kontejneri.map((k) => (
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

          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">
              Grand total (sve grupe): {grandTotal.toFixed(2)} €
            </div>
            <div className="text-sm text-slate-500">
              Plaćanje se radi po dobavljaču (svaka faktura posebno).
            </div>
          </section>
        </div>
      )}
    </div>
  );
}