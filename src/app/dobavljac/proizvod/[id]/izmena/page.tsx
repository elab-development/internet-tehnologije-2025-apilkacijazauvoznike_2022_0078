"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";
import LogoutButton from "@/src/components/LogoutButton";

type Me = { id: number; uloga: "ADMIN" | "UVOZNIK" | "DOBAVLJAC" };
type Kategorija = { id: number; ime: string };

type Proizvod = {
  id: number;
  sifra: string;
  naziv: string;
  slika: string;
  sirina: number;
  visina: number;
  duzina: number;
  cena: number;
  idKategorija: number;
};

export default function IzmenaProizvodaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

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

        const pRes = await fetch(`/api/proizvodi/${id}`, { credentials: "include" });
        const pText = await pRes.text();

        let pJson: any = null;
        try { pJson = JSON.parse(pText); } catch { }

        if (!pRes.ok || (pJson && pJson.ok === false)) {
          setError(pJson?.message ?? pJson?.error ?? pText ?? "Ne mogu da učitam proizvod.");
          setLoading(false);
          return;
        }

        const proizvod: Proizvod =
          pJson?.proizvod ?? pJson?.data ?? pJson;

        setSifra(proizvod.sifra ?? "");
        setNaziv(proizvod.naziv ?? "");
        setSlika(proizvod.slika ?? "");
        setSirina(String(proizvod.sirina ?? ""));
        setVisina(String(proizvod.visina ?? ""));
        setDuzina(String(proizvod.duzina ?? ""));
        setCena(String(proizvod.cena ?? ""));
        setIdKategorija(String(proizvod.idKategorija ?? ""));

        setLoading(false);
      } catch {
        setError("Greška pri učitavanju.");
        setLoading(false);
      }
    }

    if (!Number.isFinite(id)) {
      return;
    }

    init();
  }, [id, router]);

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
      const res = await fetch(`/api/proizvodi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const text = await res.text();
      console.log("PATCH /api/proizvodi/[id] status:", res.status, "body:", text);

      let json: any = null;
      try { json = JSON.parse(text); } catch { }

      if (!res.ok || (json && json.ok === false)) {
        setError(json?.message ?? json?.error ?? text ?? "Neuspešna izmena proizvoda.");
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
        <h1 className="text-xl font-semibold">Izmena proizvoda</h1>
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

        <Button type="submit">Sačuvaj izmene</Button>
      </form>
    </div>
  );
}