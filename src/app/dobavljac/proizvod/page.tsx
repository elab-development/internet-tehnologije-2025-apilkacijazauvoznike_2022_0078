"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";
import ProductCard, { Product } from "@/src/components/ProductCard";
import { homeByRole } from "@/src/lib/role_routes";

type Me = { id: number; uloga: "ADMIN" | "UVOZNIK" | "DOBAVLJAC" };

type Kategorija = { id: number; ime: string; opis?: string | null };

export default function SupplierProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  const [kategorije, setKategorije] = useState<Kategorija[]>([]);
  const [kategorijaId, setKategorijaId] = useState<number | "">("");

  async function handleDelete(id: number) {
    const res = await fetch(`/api/proizvodi/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const text = await res.text();

    if (!res.ok) {
      alert(`Brisanje nije uspelo!\n ${text || "(prazno)"}`);
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleEdit(id: number) {
    router.push(`/dobavljac/proizvod/${id}/izmena`);
  }

  async function loadProducts(selectedKid: number | "" = kategorijaId) {
    setError("");

    const url =
      selectedKid === ""
        ? "/api/dobavljac/proizvodi"
        : `/api/dobavljac/proizvodi?kategorijaId=${selectedKid}`;

    const pRes = await fetch(url, { credentials: "include", cache: "no-store" });

    if (!pRes.ok) {
      setError("Ne mogu da učitam proizvode.");
      return;
    }

    const pJson = await pRes.json();

    if (!pJson.ok) {
      setError(pJson.message ?? "Greška API-ja.");
      return;
    }

    const list = pJson.proizvodi;
    setProducts(Array.isArray(list) ? list : []);
  }

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });

        if (!meRes.ok) {
          setLoading(false);
          router.push("/login");
          return;
        }

        const meJson = await meRes.json();
        const me = meJson.data as Me;

        if (me.uloga !== "DOBAVLJAC") {
          router.replace(homeByRole(me.uloga));
          return;
        }

        const kRes = await fetch("/api/kategorije", { credentials: "include", cache: "no-store" });
        if (kRes.ok) {
          const kJson = await kRes.json();
          setKategorije(Array.isArray(kJson?.data) ? kJson.data : []);
        }

        await loadProducts("");

        setLoading(false);
      } catch (err) {
        setError("Fetch pukao");
        setLoading(false);
      }
    }

    init();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Učitavanje...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
        <span className="font-semibold">Greška:</span> {error}
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Dobavljač | Proizvodi
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Moji proizvodi
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Pregled kompletne ponude proizvoda sa mogućnošću filtriranja po
              kategoriji, izmene postojećih stavki i dodavanja novih proizvoda.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/dobavljac/proizvod/novi")}>
              + Novi proizvod
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid min-w-[220px] gap-2 text-sm font-medium text-slate-700">
            <span>Kategorija</span>
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              value={kategorijaId}
              onChange={(e) => setKategorijaId(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <option value="">Sve</option>
              {kategorije.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.ime}
                </option>
              ))}
            </select>
          </label>

          <Button onClick={() => loadProducts(kategorijaId)}>Primeni filter</Button>
        </div>
      </section>

      <section className="grid gap-4">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Nema proizvoda</h3>
            <p className="mt-2 text-sm text-slate-600">
              Trenutno nema proizvoda za izabrani prikaz.
            </p>
          </div>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <ProductCard p={p} onDelete={handleDelete} onEdit={handleEdit} />
            </div>
          ))
        )}
      </section>
    </div>
  );
}