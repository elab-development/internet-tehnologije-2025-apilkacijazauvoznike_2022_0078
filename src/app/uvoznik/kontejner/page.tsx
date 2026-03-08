"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";

type Stavka = {
  rb: number;
  idKontejner: number;
  idProizvod: number;
  kolicina: number;
  iznosStavke: number;
  zapreminaStavke: number | null;
  naziv: string;
  slika: string;
  cena: number;
  dobavljacIme: string | null;
  kategorijaIme: string | null;
};

type KontejnerStatus = "OPEN" | "CLOSED" | "REOPEN" | "PAUSED" | "PAID";

type KontejnerWithStavke = {
  idKontejner: number;
  status: KontejnerStatus;
  maxZapremina: number;
  trenutnaZapremina: number | null;
  cenaKontejnera: number;
  ukupnaCenaKontejnera: number | null;
  stavke: Stavka[];
};

function isEditable(status: KontejnerStatus) {
  return status === "OPEN" || status === "REOPEN";
}

function shouldBeExpanded(status: KontejnerStatus) {
  return status === "OPEN" || status === "REOPEN";
}

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

function getDobavljacKey(k: KontejnerWithStavke) {
  return (k.stavke?.[0]?.dobavljacIme ?? "Nepoznat dobavljač").trim() || "Nepoznat dobavljač";
}

export default function UvoznikKontejnerPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [kontejneri, setKontejneri] = useState<KontejnerWithStavke[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [openBox, setOpenBox] = useState<Record<number, boolean>>({});
  const [busyRb, setBusyRb] = useState<number | null>(null);
  const [busyK, setBusyK] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/uvoznik/kontejner", {
        cache: "no-store",
        credentials: "include",
      });

      const json: any = await safeJson(res);

      if (!res.ok || !json?.ok) {
        setError(
          json?.message ||
          json?.error ||
          "Greška (moguće da se server kompajlira / ruta pukla). Probajte refresh."
        );
        setLoading(false);
        return;
      }

      const list: KontejnerWithStavke[] = json.kontejneri || [];
      setKontejneri(list);

      const nextOpen: Record<number, boolean> = {};
      for (const k of list) nextOpen[k.idKontejner] = shouldBeExpanded(k.status);
      setOpenBox(nextOpen);

      setLoading(false);
    } catch {
      setError("Greška pri učitavanju");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function callPost(url: string, payload: any) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const json: any = await safeJson(res);
    return { res, json };
  }

  async function onReopen(idKontejner: number) {
    const ok = confirm("REOPEN će pauzirati trenutni OPEN kontejner (za ISTOG dobavljača). Nastaviti?");
    if (!ok) return;

    try {
      setBusyK(idKontejner);
      const { res, json } = await callPost("/api/uvoznik/kontejner/reopen", { idKontejner });
      if (!res.ok || !json?.ok) {
        alert(json?.message ?? json?.error ?? "Greška");
        return;
      }
      await load();
    } finally {
      setBusyK(null);
    }
  }

  async function onCloseReopen(idKontejner: number) {
    const ok = confirm("Zatvarate REOPEN kontejner i vraćate PAUSED u OPEN (za ISTOG dobavljača). Nastaviti?");
    if (!ok) return;

    try {
      setBusyK(idKontejner);
      const { res, json } = await callPost("/api/uvoznik/kontejner/reopen/close", { idKontejner });
      if (!res.ok || !json?.ok) {
        alert(json?.message ?? json?.error ?? "Greška");
        return;
      }
      await load();
    } finally {
      setBusyK(null);
    }
  }

  async function onDeleteKontejner(idKontejner: number) {
    const ok = confirm("Ovo briše ceo kontejner i sve njegove stavke. Nastaviti?");
    if (!ok) return;

    try {
      setBusyK(idKontejner);
      const { res, json } = await callPost("/api/uvoznik/kontejner/delete", { idKontejner });
      if (!res.ok || !json?.ok) {
        alert(json?.message ?? json?.error ?? "Greška");
        return;
      }
      await load();
    } finally {
      setBusyK(null);
    }
  }

  async function changeQty(rb: number, delta: 1 | -1) {
    try {
      setBusyRb(rb);

      const doReq = async (forceNewContainer: boolean) => {
        const res = await fetch("/api/uvoznik/kontejner/item", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ rb, delta, forceNewContainer }),
        });
        const json: any = await safeJson(res);
        return { res, json };
      };

      const { res, json } = await doReq(false);

      if (res.status === 409 && json?.error === "CONTAINER_OVERFLOW") {
        const ok = confirm(json?.message ?? "Nema mesta. Dodati u novi kontejner?");
        if (!ok) return;

        const retry = await doReq(true);
        if (!retry.res.ok || !retry.json?.ok) {
          alert(retry.json?.message ?? retry.json?.error ?? "Greška");
          return;
        }

        await load();
        return;
      }

      if (res.status === 409 && json?.error === "REOPEN_CONTAINER_FULL") {
        alert(json?.message ?? "REOPEN kontejner je pun. Zatvorite ili obrišite REOPEN kontejner.");
        return;
      }

      if (!res.ok || !json?.ok) {
        alert(json?.message ?? json?.error ?? "Greška");
        return;
      }

      await load();
    } finally {
      setBusyRb(null);
    }
  }

  // grupisanje po dobavljacu i sortiranje unutar grupe
  const grouped = useMemo(() => {
    const map = new Map<string, { dobavljacIme: string; kontejneri: KontejnerWithStavke[] }>();

    for (const k of kontejneri) {
      const key = getDobavljacKey(k);
      if (!map.has(key)) map.set(key, { dobavljacIme: key, kontejneri: [] });
      map.get(key)!.kontejneri.push(k);
    }

    const groups = Array.from(map.values());

    groups.sort((a, b) => a.dobavljacIme.localeCompare(b.dobavljacIme, "sr"));

    for (const g of groups) g.kontejneri.sort((a, b) => a.idKontejner - b.idKontejner);

    return groups;
  }, [kontejneri]);

  // numeracija kontejnera unutar grupe 
  const displayNoInGroupById = useMemo(() => {
    const map: Record<number, number> = {};
    for (const g of grouped) {
      g.kontejneri.forEach((k, idx) => {
        map[k.idKontejner] = idx + 1;
      });
    }
    return map;
  }, [grouped]);

  if (loading) return <div style={{ padding: 16 }}>Učitavanje...</div>;
  if (error) return <div style={{ padding: 16, color: "red" }}>{error}</div>;

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Uvoznik / Korpa
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Moji kontejneri
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Pregled kontejnera grupisanih po dobavljaču, sa stavkama, statusima i
              kontrolama za upravljanje korpom.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={load}>Osveži</Button>
            <Button onClick={() => router.push("/uvoznik/checkout")}>
              Nastavi na pregled
            </Button>
          </div>
        </div>
      </section>

      {grouped.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Korpa je prazna</h3>
          <p className="mt-2 text-sm text-slate-600">
            Trenutno nema kontejnera sa stavkama.
          </p>
        </section>
      ) : (
        <div className="grid gap-5">
          {grouped.map((g) => {
            const sumaRobe = g.kontejneri.reduce(
              (acc, k) => acc + Number(k.ukupnaCenaKontejnera ?? 0),
              0
            );

            return (
              <section
                key={g.dobavljacIme}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-slate-900">
                      Dobavljač: {g.dobavljacIme}
                    </div>
                    <div className="text-sm text-slate-600">
                      Kontejnera: <span className="font-semibold">{g.kontejneri.length}</span> •
                      Roba ukupno: <span className="font-semibold"> {sumaRobe.toFixed(2)} €</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    Kontejneri su grupisani po dobavljaču radi preglednosti.
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  {g.kontejneri.map((k) => {
                    const fill = ((k.trenutnaZapremina ?? 0) / (k.maxZapremina * 0.9)) * 100;
                    const isOpen = !!openBox[k.idKontejner];
                    const editable = isEditable(k.status);

                    const displayNo = displayNoInGroupById[k.idKontejner] ?? k.idKontejner;

                    return (
                      <article
                        key={k.idKontejner}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="text-base font-semibold text-slate-900">
                              Kontejner {displayNo} — {k.status}
                            </div>
                            <div className="text-sm text-slate-600">
                              Popunjenost:{" "}
                              <span className="font-semibold">
                                {Number.isFinite(fill) ? fill.toFixed(2) : "0.00"}%
                              </span>{" "}
                              • Ukupno:{" "}
                              <span className="font-semibold">
                                {(k.ukupnaCenaKontejnera ?? 0).toFixed(2)} €
                              </span>
                            </div>

                            <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-slate-700"
                                style={{ width: `${Math.max(0, Math.min(fill, 100))}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            {k.status === "CLOSED" && (
                              <Button
                                onClick={() => onReopen(k.idKontejner)}
                                disabled={busyK === k.idKontejner}
                              >
                                REOPEN
                              </Button>
                            )}

                            {k.status === "REOPEN" && (
                              <Button
                                onClick={() => onCloseReopen(k.idKontejner)}
                                disabled={busyK === k.idKontejner}
                              >
                                Zatvori REOPEN
                              </Button>
                            )}

                            {k.status === "PAUSED" && (
                              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                                Pauziran (čeka povratak u OPEN)
                              </div>
                            )}

                            <Button
                              onClick={() => onDeleteKontejner(k.idKontejner)}
                              disabled={busyK === k.idKontejner}
                            >
                              Obriši
                            </Button>

                            <Button
                              onClick={() =>
                                setOpenBox((prev) => ({
                                  ...prev,
                                  [k.idKontejner]: !prev[k.idKontejner],
                                }))
                              }
                            >
                              {isOpen ? "Sakrij" : "Prikaži"} stavke
                            </Button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="mt-4 grid gap-3">
                            {k.stavke.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                                Nema stavki.
                              </div>
                            ) : (
                              k.stavke.map((s) => (
                                <div
                                  key={s.rb}
                                  className="rounded-2xl border border-slate-200 bg-white p-4"
                                >
                                  <div className="flex flex-wrap items-center gap-4">
                                    <img
                                      src={s.slika}
                                      alt={s.naziv}
                                      width={60}
                                      height={60}
                                      style={{ objectFit: "cover", borderRadius: 8 }}
                                    />

                                    <div className="min-w-[220px] flex-1 space-y-1">
                                      <div className="text-base font-semibold text-slate-900">
                                        {s.naziv}
                                      </div>
                                      <div className="text-sm text-slate-600">
                                        Dobavljač: {s.dobavljacIme ?? "-"} • Kategorija:{" "}
                                        {s.kategorijaIme ?? "-"}
                                      </div>
                                      <div className="text-sm text-slate-600">
                                        Cena: {s.cena} € • Iznos stavke:{" "}
                                        <span className="font-semibold text-slate-900">
                                          {s.iznosStavke} €
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid gap-2 justify-items-center">
                                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                                        <Button
                                          onClick={() => changeQty(s.rb, -1)}
                                          disabled={busyRb === s.rb}
                                          style={{ visibility: editable ? "visible" : "hidden" }}
                                        >
                                          -
                                        </Button>
                                        <b className="min-w-[24px] text-center">{s.kolicina}</b>
                                        <Button
                                          onClick={() => changeQty(s.rb, 1)}
                                          disabled={busyRb === s.rb}
                                          style={{ visibility: editable ? "visible" : "hidden" }}
                                        >
                                          +
                                        </Button>
                                      </div>

                                      {!editable && (
                                        <div className="text-center text-[11px] text-slate-500">
                                          {k.status === "CLOSED"
                                            ? "Zatvoren kontejner"
                                            : k.status === "PAUSED"
                                              ? "Pauziran kontejner"
                                              : "Neizmenjivo"}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}