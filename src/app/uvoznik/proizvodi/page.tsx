"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import ProductCard from "@/src/components/ProductCard";
import { homeByRole } from "@/src/lib/role_routes";

type ProizvodRow = {
  id: number;
  sifra: string;
  naziv: string;
  cena: number;
  slika: string;

  sirina: number;
  visina: number;
  duzina: number;

  idKategorija: number;
  kategorijaIme: string | null;

  idDobavljac: number;
  dobavljacIme: string | null;
};

type ApiResp = {
  ok: boolean;
  proizvodi?: ProizvodRow[];
  error?: string;
  message?: string;
};

type KursResp = {
  ok: boolean;
  from?: string;
  to?: string;
  rate?: number;
  date?: string | null;
  error?: string;
  message?: string;
};

type Valuta = "EUR" | "USD";

export default function UvoznikProizvodiPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [proizvodi, setProizvodi] = useState<ProizvodRow[]>([]);
  const [q, setQ] = useState("");

  const [selectedDobavljacId, setSelectedDobavljacId] = useState<number | "">("");
  const [selectedKategorijaId, setSelectedKategorijaId] = useState<number | "">("");

  const [addingId, setAddingId] = useState<number | null>(null);
  const [qtyById, setQtyById] = useState<Record<number, number>>({});

  const [valuta, setValuta] = useState<Valuta>("EUR");
  const [kurs, setKurs] = useState<number>(1);
  const [kursDatum, setKursDatum] = useState<string | null>(null);
  const [loadingKurs, setLoadingKurs] = useState(false);
  const [kursErr, setKursErr] = useState<string | null>(null);

  let redirected = false;

  function buildUrl() {
    const params = new URLSearchParams();

    if (selectedDobavljacId !== "") {
      params.set("dobavljacId", String(selectedDobavljacId));
    }

    if (selectedKategorijaId !== "") {
      params.set("kategorijaId", String(selectedKategorijaId));
    }

    const qs = params.toString();
    return `/api/uvoznik/proizvodi${qs ? `?${qs}` : ""}`;
  }

  async function load(withFilters: boolean) {
    setLoading(true);
    setErr(null);

    try {
      const meRes = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!meRes.ok) {
        router.push("/login");
        return;
      }

      const meJson = await meRes.json();
      const uloga = meJson?.data?.uloga;

      if (uloga !== "UVOZNIK") {
        redirected = true;
        router.replace(homeByRole(uloga));
        return;
      }

      const url = withFilters ? buildUrl() : "/api/uvoznik/proizvodi";

      const res = await fetch(url, {
        credentials: "include",
        cache: "no-store",
      });

      const json: ApiResp = await res.json();

      if (!res.ok || !json.ok) {
        setErr(json.message ?? json.error ?? "Greška pri učitavanju proizvoda");
        return;
      }

      const list = json.proizvodi ?? [];
      setProizvodi(list);

      setQtyById((prev) => {
        const next = { ...prev };

        for (const p of list) {
          if (!next[p.id] || next[p.id] < 1) {
            next[p.id] = 1;
          }
        }

        return next;
      });
    } catch (e: any) {
      setErr(e?.message ?? "Neočekivana greška");
    } finally {
      if (!redirected) setLoading(false);
    }
  }

  async function loadKurs(nextValuta: Valuta) {
    setLoadingKurs(true);
    setKursErr(null);

    try {
      if (nextValuta === "EUR") {
        setKurs(1);
        setKursDatum(null);
        return;
      }

      const res = await fetch(`/api/kurs?from=EUR&to=${nextValuta}`, {
        credentials: "include",
        cache: "no-store",
      });

      const json: KursResp = await res.json();

      if (!res.ok || !json.ok || typeof json.rate !== "number") {
        setKursErr(json.message ?? json.error ?? "Greška pri učitavanju kursa.");
        setKurs(1);
        setKursDatum(null);
        return;
      }

      setKurs(json.rate);
      setKursDatum(json.date ?? null);
    } catch (e: any) {
      setKursErr(e?.message ?? "Greška pri učitavanju kursa.");
      setKurs(1);
      setKursDatum(null);
    } finally {
      setLoadingKurs(false);
    }
  }

  useEffect(() => {
    load(false);
  }, []);

  useEffect(() => {
    loadKurs(valuta);
  }, [valuta]);

  async function addToCart(idProizvod: number) {
    const qty = Math.max(1, Number(qtyById[idProizvod] ?? 1));

    try {
      setAddingId(idProizvod);

      const doRequest = async (forceNewContainer: boolean) => {
        const res = await fetch("/api/uvoznik/kontejner/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            idProizvod,
            kolicina: qty,
            forceNewContainer,
          }),
        });

        const json = await res.json();
        return { res, json };
      };

      const firstTry = await doRequest(false);

      if (firstTry.res.status === 409 && firstTry.json?.error === "CONTAINER_OVERFLOW") {
        const ok = confirm(
          firstTry.json?.message ?? "Nema mesta u kontejneru. Otvoriti novi kontejner?"
        );

        if (!ok) return;

        const retry = await doRequest(true);

        if (!retry.res.ok || !retry.json?.ok) {
          alert(retry.json?.message ?? retry.json?.error ?? "Greška pri dodavanju");
          return;
        }

        alert("Dodato u novi kontejner!");
        return;
      }

      if (!firstTry.res.ok || !firstTry.json?.ok) {
        alert(firstTry.json?.message ?? firstTry.json?.error ?? "Greška pri dodavanju");
        return;
      }

      alert("Dodato u korpu!");
    } catch (e: any) {
      alert(e?.message ?? "Greška");
    } finally {
      setAddingId(null);
    }
  }

  const dobavljacOptions = useMemo(() => {
    const map = new Map<number, string>();

    for (const p of proizvodi) {
      map.set(p.idDobavljac, p.dobavljacIme ?? `Dobavljač ${p.idDobavljac}`);
    }

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [proizvodi]);

  const kategorijaOptions = useMemo(() => {
    const map = new Map<number, string>();

    for (const p of proizvodi) {
      map.set(p.idKategorija, p.kategorijaIme ?? `Kategorija ${p.idKategorija}`);
    }

    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [proizvodi]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return proizvodi;

    return proizvodi.filter((p) => {
      return (
        p.naziv.toLowerCase().includes(term) ||
        p.sifra.toLowerCase().includes(term) ||
        (p.kategorijaIme ?? "").toLowerCase().includes(term) ||
        (p.dobavljacIme ?? "").toLowerCase().includes(term)
      );
    });
  }, [proizvodi, q]);

  function incQty(id: number) {
    setQtyById((prev) => ({
      ...prev,
      [id]: Math.min(999, (prev[id] ?? 1) + 1),
    }));
  }

  function decQty(id: number) {
    setQtyById((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) - 1),
    }));
  }

  function formatBroj(vrednost: number) {
    try {
      return new Intl.NumberFormat("sr-RS", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(vrednost);
    } catch {
      return vrednost.toFixed(2);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Učitavanje proizvoda...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Uvoznik | Ponuda proizvoda
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Proizvodi mojih dobavljača
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Pregled proizvoda dostupnih kroz aktivne saradnje. Možete filtrirati
              ponudu po dobavljaču i kategoriji, pretraživati rezultate, menjati
              valutu prikaza i dodavati proizvode u korpu.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5">
          <div className="flex flex-wrap items-end gap-4">
            <label className="grid min-w-[220px] gap-2 text-sm font-medium text-slate-700">
              <span>Dobavljač</span>
              <select
                value={selectedDobavljacId}
                onChange={(e) =>
                  setSelectedDobavljacId(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">Svi</option>
                {dobavljacOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-[220px] gap-2 text-sm font-medium text-slate-700">
              <span>Kategorija</span>
              <select
                value={selectedKategorijaId}
                onChange={(e) =>
                  setSelectedKategorijaId(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">Sve</option>
                {kategorijaOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <Button onClick={() => load(true)}>Primeni filtere</Button>
            </div>

            <div className="ml-auto">
              <Button onClick={() => router.push("/uvoznik/uporedi")}>
                Otvori upoređivanje
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Pretraga</span>
              <Input
                value={q}
                onChange={(e: any) => setQ(e.target.value)}
                placeholder="Pretraga (naziv, šifra, dobavljač, kategorija)"
              />
            </div>

            <label className="grid min-w-[180px] gap-2 text-sm font-medium text-slate-700">
              <span>Valuta</span>
              <select
                value={valuta}
                onChange={(e) => setValuta(e.target.value as Valuta)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {valuta !== "EUR" && kursErr === null && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 shadow-sm">
          Trenutni kurs: <span className="font-semibold">1 EUR = {formatBroj(kurs)} {valuta}</span>
          {loadingKurs ? " (učitavanje kursa...)" : ""}
          {kursDatum ? ` (datum: ${kursDatum})` : ""}
        </div>
      )}

      {kursErr && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
          <span className="font-semibold">Greška kursa:</span> {kursErr}
        </div>
      )}

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          <span className="font-semibold">Greška:</span> {err}
        </div>
      )}

      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">
            Nema proizvoda za prikaz
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Nema rezultata za zadate filtere ili trenutno nema aktivnih saradnji.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {filtered.map((p) => {
            const konvertovanaCena = p.cena * kurs;

            return (
              <article
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="grid gap-4">
                  <ProductCard p={p as any} />

                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                      Dobavljač: <span className="font-semibold">{p.dobavljacIme ?? "-"}</span>
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                      Kategorija: <span className="font-semibold">{p.kategorijaIme ?? "-"}</span>
                    </span>
                  </div>

                  {valuta !== "EUR" && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                      Preračunata cena:{" "}
                      <span className="font-semibold">
                        ≈ {formatBroj(konvertovanaCena)} {valuta}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                    <Button onClick={() => router.push(`/uvoznik/uporedi?left=${p.id}`)}>
                      Uporedi
                    </Button>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                        <Button onClick={() => decQty(p.id)} disabled={addingId === p.id}>
                          -
                        </Button>

                        <div className="min-w-[36px] text-center text-sm font-semibold text-slate-900">
                          {qtyById[p.id] ?? 1}
                        </div>

                        <Button onClick={() => incQty(p.id)} disabled={addingId === p.id}>
                          +
                        </Button>
                      </div>

                      <Button onClick={() => addToCart(p.id)} disabled={addingId === p.id}>
                        {addingId === p.id ? "Dodavanje..." : "Dodaj u korpu"}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}