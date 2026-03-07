"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/src/components/Input";
import Button from "@/src/components/Button";
import { homeByRole } from "@/src/lib/role_routes";

type PublicRole = "UVOZNIK" | "DOBAVLJAC";

export default function RegisterPage() {
  const router = useRouter();

  const [imePrezime, setImePrezime] = useState("");
  const [email, setEmail] = useState("");
  const [sifra, setSifra] = useState("");
  const [potvrdaSifre, setPotvrdaSifre] = useState("");
  const [uloga, setUloga] = useState<PublicRole>("UVOZNIK");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!imePrezime.trim() || !email.trim() || !sifra.trim() || !potvrdaSifre.trim()) {
      setError("Sva polja su obavezna.");
      return;
    }

    if (sifra.length < 6) {
      setError("Sifra mora imati bar 6 karaktera.");
      return;
    }

    if (sifra !== potvrdaSifre) {
      setError("Sifra i potvrda sifre se ne poklapaju.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          imePrezime: imePrezime.trim(),
          email: email.trim(),
          sifra,
          uloga,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.message ?? "Neuspesna registracija.");
        return;
      }

      router.push(homeByRole(uloga));
    } catch {
      setError("Greska pri registraciji (fetch/network).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Registracija</h1>

      {error && <div className="text-red-600">{error}</div>}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input
          label="Ime i prezime"
          value={imePrezime}
          onChange={(e) => setImePrezime(e.target.value)}
          required
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Sifra"
          type="password"
          value={sifra}
          onChange={(e) => setSifra(e.target.value)}
          required
        />

        <Input
          label="Potvrda sifre"
          type="password"
          value={potvrdaSifre}
          onChange={(e) => setPotvrdaSifre(e.target.value)}
          required
        />

        <label className="block space-y-1">
          <span className="text-sm">Uloga</span>
          <select
            className="w-full border rounded px-3 py-2 text-sm"
            value={uloga}
            onChange={(e) => setUloga(e.target.value as PublicRole)}
          >
            <option value="UVOZNIK">Uvoznik</option>
            <option value="DOBAVLJAC">Dobavljac</option>
          </select>
        </label>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Registracija..." : "Registruj se"}
          </Button>

          <Button type="button" variant="secondary" onClick={() => router.push("/")}>
            Nazad
          </Button>
        </div>
      </form>
    </div>
  );
}