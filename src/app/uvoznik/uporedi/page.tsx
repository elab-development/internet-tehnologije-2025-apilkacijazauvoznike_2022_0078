"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/src/components/Button";

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

type DobavljacOpt = { idDobavljac: number; imePrezime: string };
type KategorijaOpt = { id: number; ime: string };

async function safeJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json().catch(() => ({}));
  const text = await res.text().catch(() => "");
  return { ok: false, error: "NON_JSON_RESPONSE", message: text.slice(0, 200) };
}

function parseId(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function UvoznikUporediContent() {
  const router = useRouter();
  const sp = useSearchParams();

  const leftFromQuery = parseId(sp.get("left"));
  const rightFromQuery = parseId(sp.get("right"));

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [dobavljaci, setDobavljaci] = useState<DobavljacOpt[]>([]);
  const [kategorije, setKategorije] = useState<KategorijaOpt[]>([]);

  const [left, setLeft] = useState<ProizvodRow | null>(null);
  const [right, setRight] = useState<ProizvodRow | null>(null);

  const [rDobId, setRDobId] = useState<number | "">("");
  const [rKatId, setRKatId] = useState<number | "">("");
  const [rProizvodi, setRProizvodi] = useState<ProizvodRow[]>([]);
  const [rProizvodId, setRProizvodId] = useState<number | "">("");

  const [lDobId, setLDobId] = useState<number | "">("");
  const [lKatId, setLKatId] = useState<number | "">("");
  const [lProizvodi, setLProizvodi] = useState<ProizvodRow[]>([]);
  const [lProizvodId, setLProizvodId] = useState<number | "">("");

  async function loadOptions() {
    const [dRes, kRes] = await Promise.all([
      fetch("/api/uvoznik/dobavljaci", { credentials: "include", cache: "no-store" }),
      fetch("/api/kategorije", { credentials: "include", cache: "no-store" }),
    ]);

    const dJson: any = await safeJson(dRes);
    const kJson: any = await safeJson(kRes);

    if (!dRes.ok || !dJson.ok) {
      throw new Error(dJson.message ?? dJson.error ?? "Ne mogu da učitam dobavljače.");
    }
    if (!kRes.ok || !kJson.ok) {
      throw new Error(kJson.message ?? kJson.error ?? "Ne mogu da učitam kategorije.");
    }

    setDobavljaci(
      (dJson.dobavljaci ?? []).map((x: any) => ({
        idDobavljac: x.idDobavljac,
        imePrezime: x.imePrezime,
      }))
    );
    setKategorije((kJson.data ?? []).map((x: any) => ({ id: x.id, ime: x.ime })));
  }

  async function fetchProductById(id: number) {
    const res = await fetch(`/api/uvoznik/proizvodi/${id}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json: any = await safeJson(res);
    if (!res.ok || !json.ok) {
      throw new Error(json.message ?? json.error ?? "Ne mogu da učitam proizvod.");
    }
    return json.proizvod as ProizvodRow;
  }

  async function fetchProductsList(dobId: number | "", katId: number | "") {
    const params = new URLSearchParams();
    if (dobId !== "") params.set("dobavljacId", String(dobId));
    if (katId !== "") params.set("kategorijaId", String(katId));

    const res = await fetch(`/api/uvoznik/proizvodi?${params.toString()}`, {
      credentials: "include",
      cache: "no-store",
    });
    const json: any = await safeJson(res);
    if (!res.ok || !json.ok) {
      throw new Error(json.message ?? json.error ?? "Ne mogu da učitam listu proizvoda.");
    }
    return (json.proizvodi ?? []) as ProizvodRow[];
  }

  async function init() {
    setLoading(true);
    setErr(null);

    try {
      await loadOptions();

      if (leftFromQuery) {
        const p = await fetchProductById(leftFromQuery);
        setLeft(p);
      }
      if (rightFromQuery) {
        const p = await fetchProductById(rightFromQuery);
        setRight(p);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Greška");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  async function loadLeftList() {
    if (lDobId === "") {
      setLProizvodi([]);
      setLProizvodId("");
      return;
    }
    const list = await fetchProductsList(lDobId, lKatId);
    setLProizvodi(list);
    setLProizvodId("");
  }

  async function loadRightList() {
    if (rDobId === "") {
      setRProizvodi([]);
      setRProizvodId("");
      return;
    }
    const list = await fetchProductsList(rDobId, rKatId);
    setRProizvodi(list);
    setRProizvodId("");
  }

  async function pickLeft() {
    if (lProizvodId === "") return;
    const p = await fetchProductById(Number(lProizvodId));
    setLeft(p);

    setLProizvodId("");
    setLProizvodi([]);
  }

  async function pickRight() {
    if (rProizvodId === "") return;
    const p = await fetchProductById(Number(rProizvodId));
    setRight(p);

    setRProizvodId("");
    setRProizvodi([]);
  }

  function clearLeft() {
    setLeft(null);
    setLDobId("");
    setLKatId("");
    setLProizvodi([]);
    setLProizvodId("");
    router.replace("/uvoznik/uporedi");
  }

  function clearRight() {
    setRight(null);
    setRDobId("");
    setRKatId("");
    setRProizvodi([]);
    setRProizvodId("");
    router.replace(left ? `/uvoznik/uporedi?left=${left.id}` : "/uvoznik/uporedi");
  }

  const canCompare = useMemo(() => Boolean(left && right), [left, right]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Učitavanje...
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
        {err}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Uvoznik | Upoređivanje
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Uporedi proizvode
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Izaberite dva proizvoda iz ponude aktivnih dobavljača i uporedite osnovne
              karakteristike, cenu, kategoriju i dimenzije.
            </p>
          </div>

          <Button onClick={() => router.push("/uvoznik/proizvodi")}>
            Nazad na proizvode
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Proizvod A</h2>
              <p className="text-sm text-slate-500">Leva strana poređenja</p>
            </div>

            {left && (
              <Button variant="danger" onClick={clearLeft}>
                X
              </Button>
            )}
          </div>

          {!left ? (
            <div className="mt-5 grid gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Izaberi dobavljača i opciono kategoriju, zatim učitaj listu proizvoda.
              </div>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Dobavljač (obavezno)</span>
                <select
                  value={lDobId}
                  onChange={(e) => setLDobId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value="">Izaberi...</option>
                  {dobavljaci.map((d) => (
                    <option key={d.idDobavljac} value={d.idDobavljac}>
                      {d.imePrezime}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Kategorija (opciono)</span>
                <select
                  value={lKatId}
                  onChange={(e) => setLKatId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value="">Sve</option>
                  {kategorije.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ime}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                onClick={async () => {
                  try {
                    await loadLeftList();
                  } catch (e: any) {
                    setErr(e?.message ?? "Greška");
                  }
                }}
              >
                Prikaži proizvode
              </Button>

              {lProizvodi.length > 0 && (
                <>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    <span>Proizvod</span>
                    <select
                      value={lProizvodId}
                      onChange={(e) =>
                        setLProizvodId(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                    >
                      <option value="">Izaberi...</option>
                      {lProizvodi.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.naziv} - {p.cena}€
                        </option>
                      ))}
                    </select>
                  </label>

                  <Button
                    onClick={async () => {
                      try {
                        await pickLeft();
                      } catch (e: any) {
                        setErr(e?.message ?? "Greška");
                      }
                    }}
                  >
                    Izaberi proizvod A
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <img
                src={left.slika}
                alt={left.naziv}
                className="aspect-[4/3] w-full rounded-2xl border border-slate-200 object-contain bg-white"
              />

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">{left.naziv}</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                    Šifra: <span className="font-semibold">{left.sifra}</span>
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                    Dobavljač: <span className="font-semibold">{left.dobavljacIme ?? "-"}</span>
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                    Kategorija: <span className="font-semibold">{left.kategorijaIme ?? "-"}</span>
                  </span>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Dimenzije</span>
                  <span className="font-medium text-slate-900">
                    {left.sirina} × {left.visina} × {left.duzina}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Cena</span>
                  <span className="text-base font-semibold text-slate-900">{left.cena}€</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Proizvod B</h2>
              <p className="text-sm text-slate-500">Desna strana poređenja</p>
            </div>

            {right && (
              <Button variant="danger" onClick={clearRight}>
                X
              </Button>
            )}
          </div>

          {!right ? (
            <div className="mt-5 grid gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Izaberi dobavljača i opciono kategoriju, zatim učitaj listu proizvoda.
              </div>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Dobavljač (obavezno)</span>
                <select
                  value={rDobId}
                  onChange={(e) => setRDobId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value="">Izaberi...</option>
                  {dobavljaci.map((d) => (
                    <option key={d.idDobavljac} value={d.idDobavljac}>
                      {d.imePrezime}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                <span>Kategorija (opciono)</span>
                <select
                  value={rKatId}
                  onChange={(e) => setRKatId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value="">Sve</option>
                  {kategorije.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ime}
                    </option>
                  ))}
                </select>
              </label>

              <Button
                onClick={async () => {
                  try {
                    await loadRightList();
                  } catch (e: any) {
                    setErr(e?.message ?? "Greška");
                  }
                }}
              >
                Prikaži proizvode
              </Button>

              {rProizvodi.length > 0 && (
                <>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    <span>Proizvod</span>
                    <select
                      value={rProizvodId}
                      onChange={(e) =>
                        setRProizvodId(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                    >
                      <option value="">Izaberi...</option>
                      {rProizvodi.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.naziv} - {p.cena}€
                        </option>
                      ))}
                    </select>
                  </label>

                  <Button
                    onClick={async () => {
                      try {
                        await pickRight();
                      } catch (e: any) {
                        setErr(e?.message ?? "Greška");
                      }
                    }}
                  >
                    Izaberi proizvod B
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <img
                src={right.slika}
                alt={right.naziv}
                className="aspect-[4/3] w-full rounded-2xl border border-slate-200 object-contain bg-white"
              />

              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">{right.naziv}</h3>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                    Šifra: <span className="font-semibold">{right.sifra}</span>
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                    Dobavljač: <span className="font-semibold">{right.dobavljacIme ?? "-"}</span>
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                    Kategorija: <span className="font-semibold">{right.kategorijaIme ?? "-"}</span>
                  </span>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Dimenzije</span>
                  <span className="font-medium text-slate-900">
                    {right.sirina} × {right.visina} × {right.duzina}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Cena</span>
                  <span className="text-base font-semibold text-slate-900">{right.cena}€</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className={`rounded-2xl border p-4 text-sm shadow-sm ${
          canCompare
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        {canCompare
          ? "✅ Izabrana su oba proizvoda - možete ih porediti."
          : "Izaberite oba proizvoda da biste uporedili."}
      </section>
    </div>
  );
}

export default function UvoznikUporediPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Učitavanje...
        </div>
      }
    >
      <UvoznikUporediContent />
    </Suspense>
  );
}