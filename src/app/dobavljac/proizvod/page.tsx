"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";
import ProductCard, { Product } from "@/src/components/ProductCard";
import { homeByRole } from "@/src/lib/role_routes";
import LogoutButton from "@/src/components/LogoutButton";

type Me = { id: number; uloga: "ADMIN" | "UVOZNIK" | "DOBAVLJAC" };

type Kategorija = { id: number; ime: string; opis?: string | null };

export default function SupplierProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  // ✅ NOVO: kategorije + izabrana kategorija
  const [kategorije, setKategorije] = useState<Kategorija[]>([]);
  const [kategorijaId, setKategorijaId] = useState<number | "">("");

  async function handleDelete(id: number) {
    const res = await fetch(`/api/proizvodi/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const text = await res.text();

    if (!res.ok) {
      alert(`Brisanje nije uspelo. Status=${res.status}\nOdgovor: ${text || "(prazno)"}`);
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleEdit(id: number) {
    router.push(`/dobavljac/proizvod/${id}/izmena`);
  }

  // ✅ NOVO: funkcija koja učitava proizvode uz filter kategorije
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

        // ✅ NOVO: učitaj kategorije za dropdown
        const kRes = await fetch("/api/kategorije", { credentials: "include", cache: "no-store" });
        if (kRes.ok) {
          const kJson = await kRes.json();
          setKategorije(Array.isArray(kJson?.data) ? kJson.data : []);
        }

        // ✅ NOVO: učitaj proizvode (bez filtera na startu)
        await loadProducts("");

        setLoading(false);
      } catch (err) {
        setError("Fetch pukao");
        setLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="p-6">Učitavanje...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Moji proizvodi</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/dobavljac/proizvod/novi")}>+ Novi proizvod</Button>
        </div>
      </div>

      {/* ✅ NOVO: filter po kategoriji */}
      <div className="flex gap-2 items-center flex-wrap">
        <label className="flex gap-2 items-center">
          <span className="text-sm">Kategorija:</span>
          <select
            className="border rounded px-2 py-1"
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

        <Button
          variant="secondary"
          onClick={() => {
            setKategorijaId("");
            loadProducts("");
          }}
        >
          Reset
        </Button>
      </div>

      <div className="space-y-3">
        {products.length === 0 ? (
          <div>Nema proizvoda.</div>
        ) : (
          products.map((p) => (
            <ProductCard key={p.id} p={p} onDelete={handleDelete} onEdit={handleEdit} />
          ))
        )}
      </div>
    </div>
  );
}