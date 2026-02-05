"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/src/components/Button";
import ProductCard, { Product } from "@/src/components/ProductCard";
import { homeByRole } from "@/src/lib/role_routes";
import LogoutButton from "@/src/components/LogoutButton";

type Me = { id: number; uloga: "ADMIN" | "UVOZNIK" | "DOBAVLJAC" };

export default function SupplierProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

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

  useEffect(() => {
    async function init() {

      try {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });

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

        const pRes = await fetch("/api/proizvodi", { credentials: "include" });


        if (!pRes.ok) {
          setError("Ne mogu da učitam proizvode.");
          setLoading(false);
          return;
        }

        const pJson = await pRes.json();

        if (!pJson.ok) {
          setError(pJson.message ?? "Greška API-ja.");
          setLoading(false);
          return;
        }

        const list = pJson.proizvodi;

        setProducts(Array.isArray(list) ? list : []);
        setLoading(false);

      } catch (err) {
        setError("Fetch pukao");
        setLoading(false);
      }
    }

    init();
  }, []);

  if (loading) return <div className="p-6">Učitavanje...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Moji proizvodi</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/dobavljac/proizvod/novi")}>
            + Novi proizvod
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {products.length === 0 ? (
          <div>Nema proizvoda.</div>
        ) : (
          products.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}