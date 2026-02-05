"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";
import LogoutButton from "@/src/components/LogoutButton";

type Me = { id: number; uloga: "ADMIN" | "UVOZNIK" | "DOBAVLJAC" };

type Kategorija = { id: number; ime: string };

export default function NoviProizvodPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sifra, setSifra] = useState("");
  const [naziv, setNaziv] = useState("");
  const [slika, setSlika] = useState("");
  const [sirina, setSirina] = useState("");
  const [visina, setVisina] = useState("");
  const [duzina, setDuzina] = useState("");
  const [cena, setCena] = useState("");
  const [idKategorija, setIdKategorija] = useState("");

  const [kategorije, setKategorije] = useState<Kategorija[]>([]);

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

        const kRes = await fetch("/api/kategorije", { credentials: "include" });
        if (kRes.ok) {
          const kJson = await kRes.json();
          const list = kJson.kategorije ?? kJson.data ?? kJson;
          if (Array.isArray(list)) setKategorije(list);
        }

        setLoading(false);
      } catch {
        setError("Greška pri učitavanju forme.");
        setLoading(false);
      }
    }

    init();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !sifra || !naziv || !slika ||
      !sirina || !visina || !duzina || !cena || !idKategorija
    ) {
      setError("Popuni sva polja.");
      return;
    }

    if (slika.startsWith("data:image")) {
      setError("Slika mora biti URL (npr. https://...).");
      return;
    }

    const body = {
      sifra,
      naziv,
      slika,
      sirina: Number(sirina),
      visina: Number(visina),
      duzina: Number(duzina),
      cena: Number(cena),
      idKategorija: Number(idKategorija),
    };

    try {
      const res = await fetch("/api/proizvodi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const text = await res.text();
      console.log("POST /api/proizvodi status:", res.status, "body:", text);

      let json: any = null;
      try { json = JSON.parse(text); } catch { }

      if (!res.ok || (json && json.ok === false)) {
        setError(json?.message ?? json?.error ?? text ?? "Neuspešno dodavanje proizvoda.");
        return;
      }

      router.push("/dobavljac/proizvod");
    } catch {
      setError("Greška pri slanju (network).");
    }
  }

  if (loading) return <div className="p-6">Učitavanje...</div>;

  return (
    <div className="p-6 max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Novi proizvod</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/dobavljac/proizvod")}
          >
            Nazad
          </Button>

        </div>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input label="Šifra" value={sifra} onChange={(e) => setSifra(e.target.value)} required />
        <Input label="Naziv" value={naziv} onChange={(e) => setNaziv(e.target.value)} required />
        <Input label="Slika (URL)" value={slika} onChange={(e) => setSlika(e.target.value)} required />

        <div className="grid grid-cols-3 gap-3">
          <Input label="Širina" value={sirina} onChange={(e) => setSirina(e.target.value)} required />
          <Input label="Visina" value={visina} onChange={(e) => setVisina(e.target.value)} required />
          <Input label="Dužina" value={duzina} onChange={(e) => setDuzina(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Cena" value={cena} onChange={(e) => setCena(e.target.value)} required />

          {kategorije.length > 0 ? (
            <div className="space-y-1">
              <label className="text-sm">Kategorija</label>
              <select
                className="w-full border rounded p-2"
                value={idKategorija}
                onChange={(e) => setIdKategorija(e.target.value)}
                required
              >
                <option value="">-- izaberi --</option>
                {kategorije.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ime}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              label="ID kategorije"
              value={idKategorija}
              onChange={(e) => setIdKategorija(e.target.value)}
              required
            />
          )}
        </div>

        <Button type="submit">Sačuvaj</Button>
      </form>
    </div>
  );
}