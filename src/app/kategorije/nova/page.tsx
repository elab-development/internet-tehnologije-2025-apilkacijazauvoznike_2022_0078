"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";

type Me = { id: number; uloga: "ADMIN" | "UVOZNIK" | "DOBAVLJAC" };

export default function NovaKategorijaPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const returnTo = sp.get("returnTo") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [me, setMe] = useState<Me | null>(null);

  const [ime, setIme] = useState("");
  const [opis, setOpis] = useState("");

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
        const u = meJson.data as Me;

        // dozvoli ADMIN i DOBAVLJAC
        if (u.uloga !== "ADMIN" && u.uloga !== "DOBAVLJAC") {
          router.replace(homeByRole(u.uloga));
          return;
        }

        setMe(u);
        setLoading(false);
      } catch {
        setError("Greška pri učitavanju.");
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!ime.trim()) {
      setError("Ime kategorije je obavezno.");
      return;
    }

    try {
      const res = await fetch("/api/kategorije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ime: ime.trim(), opis: opis.trim() || null }),
      });

      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}

      if (!res.ok || (json && json.ok === false)) {
        setError(json?.message ?? json?.error ?? text ?? "Neuspešno dodavanje kategorije.");
        return;
      }

      // vrati nazad gde treba
      if (returnTo) router.push(returnTo);
      else if (me) router.push(homeByRole(me.uloga));
      else router.push("/");

    } catch {
      setError("Greška pri slanju (network).");
    }
  }

  if (loading) return <div className="p-6">Učitavanje...</div>;

  return (
    <div className="p-6 max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Nova kategorija</h1>

        <Button
          type="button"
          variant="secondary"
          onClick={() => (returnTo ? router.push(returnTo) : router.back())}
        >
          Nazad
        </Button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input label="Ime" value={ime} onChange={(e) => setIme(e.target.value)} required />
        <Input label="Opis (opciono)" value={opis} onChange={(e) => setOpis(e.target.value)} />

        <Button type="submit">Sačuvaj</Button>
      </form>
    </div>
  );
}