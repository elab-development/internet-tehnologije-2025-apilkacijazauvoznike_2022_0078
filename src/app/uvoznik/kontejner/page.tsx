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
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Moji kontejneri (korpa)</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={load}>Osveži</Button>
          <Button onClick={() => router.push("/uvoznik/checkout")}>Nastavi na pregled</Button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div>Korpa je prazna (nema kontejnera sa stavkama).</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {grouped.map((g) => {
            const sumaRobe = g.kontejneri.reduce((acc, k) => acc + Number(k.ukupnaCenaKontejnera ?? 0), 0);

            return (
              <div key={g.dobavljacIme} style={{ border: "1px solid #ccc", borderRadius: 12, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 16 }}>
                      <b>Dobavljač:</b> {g.dobavljacIme}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      Kontejnera: <b>{g.kontejneri.length}</b> • Roba ukupno: <b>{sumaRobe.toFixed(2)} €</b>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, opacity: 0.7, alignSelf: "center" }}>
                    Kontejneri su grupisani po dobavljaču radi preglednosti.
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                  {g.kontejneri.map((k) => {
                    const fill = ((k.trenutnaZapremina ?? 0) / (k.maxZapremina * 0.9)) * 100;
                    const isOpen = !!openBox[k.idKontejner];
                    const editable = isEditable(k.status);

                    const displayNo = displayNoInGroupById[k.idKontejner] ?? k.idKontejner;

                    return (
                      <div key={k.idKontejner} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                          <div>
                            <div>
                              <b>Kontejner {displayNo}</b> — <b>{k.status}</b>
                            </div>
                            <div style={{ fontSize: 13, opacity: 0.85 }}>
                              Popunjenost: <b>{Number.isFinite(fill) ? fill.toFixed(2) : "0.00"}%</b> • Ukupno:{" "}
                              <b>{(k.ukupnaCenaKontejnera ?? 0).toFixed(2)} €</b>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {k.status === "CLOSED" && (
                              <Button onClick={() => onReopen(k.idKontejner)} disabled={busyK === k.idKontejner}>
                                REOPEN
                              </Button>
                            )}

                            {k.status === "REOPEN" && (
                              <Button onClick={() => onCloseReopen(k.idKontejner)} disabled={busyK === k.idKontejner}>
                                Zatvori REOPEN
                              </Button>
                            )}

                            {k.status === "PAUSED" && (
                              <div style={{ fontSize: 12, opacity: 0.75, padding: "6px 8px" }}>
                                Pauziran (čeka povratak u OPEN)
                              </div>
                            )}

                            <Button onClick={() => onDeleteKontejner(k.idKontejner)} disabled={busyK === k.idKontejner}>
                              Obriši
                            </Button>

                            <Button
                              onClick={() => setOpenBox((prev) => ({ ...prev, [k.idKontejner]: !prev[k.idKontejner] }))}
                            >
                              {isOpen ? "Sakrij" : "Prikaži"} stavke
                            </Button>
                          </div>
                        </div>

                        {isOpen && (
                          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                            {k.stavke.length === 0 ? (
                              <div>Nema stavki.</div>
                            ) : (
                              k.stavke.map((s) => (
                                <div key={s.rb} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
                                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <img
                                      src={s.slika}
                                      alt={s.naziv}
                                      width={60}
                                      height={60}
                                      style={{ objectFit: "cover", borderRadius: 6 }}
                                    />

                                    <div style={{ flex: 1 }}>
                                      <div>
                                        <b>{s.naziv}</b>
                                      </div>
                                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                                        Dobavljač: {s.dobavljacIme ?? "-"} | Kategorija: {s.kategorijaIme ?? "-"}
                                      </div>
                                      <div>Cena: {s.cena} €</div>
                                      <div>Iznos stavke: {s.iznosStavke} €</div>
                                    </div>

                                    <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <Button
                                          onClick={() => changeQty(s.rb, -1)}
                                          disabled={busyRb === s.rb}
                                          style={{ visibility: editable ? "visible" : "hidden" }}
                                        >
                                          -
                                        </Button>
                                        <b style={{ minWidth: 24, textAlign: "center" }}>{s.kolicina}</b>
                                        <Button
                                          onClick={() => changeQty(s.rb, 1)}
                                          disabled={busyRb === s.rb}
                                          style={{ visibility: editable ? "visible" : "hidden" }}
                                        >
                                          +
                                        </Button>
                                      </div>

                                      {!editable && (
                                        <div style={{ fontSize: 11, opacity: 0.7 }}>
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}